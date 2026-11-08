var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// server/parks.ts
var GROUP_LABELS = {
  free: "Free Dog Parks",
  "paid-shared": "Paid \xB7 Multi-park pass (1 pass covers all)",
  "paid-single": "Paid \xB7 Single-park (own code/app)"
};
var PARKS = [
  { id: "altoona", name: "Altoona Dog Park", city: "Altoona", groupId: "free", blurb: "East metro. No pass required.", sortOrder: 1 },
  { id: "bondurant", name: "Bondurant Dog Park", city: "Bondurant", groupId: "free", blurb: "East-side free park.", sortOrder: 2 },
  { id: "windsor-heights", name: "Windsor Heights Dog Park", city: "Windsor Heights", groupId: "free", blurb: "West-central free park.", sortOrder: 3 },
  { id: "ewing", name: "Ewing Dog Park", city: "Des Moines", groupId: "paid-shared", blurb: "One shared DSM pass covers this park.", sortOrder: 4 },
  { id: "reno-memorial", name: "Reno Memorial Dog Park", city: "Des Moines", groupId: "paid-shared", blurb: "One shared DSM pass covers this park.", sortOrder: 5 },
  { id: "riverwalk", name: "Riverwalk Dog Park", city: "Des Moines", groupId: "paid-shared", blurb: "Downtown. Same shared DSM pass as Ewing and Reno.", sortOrder: 6 },
  { id: "ankeny", name: "Ankeny Dog Park", city: "Ankeny", groupId: "paid-single", blurb: "Needs Ankeny\u2019s own code or app.", sortOrder: 7 },
  { id: "raccoon-river", name: "Raccoon River Dog Park", city: "West Des Moines", groupId: "paid-single", blurb: "Needs West Des Moines\u2019 own code or app.", sortOrder: 8 },
  { id: "urbandale", name: "Urbandale Dog Park", city: "Urbandale", groupId: "paid-single", blurb: "Needs Urbandale\u2019s own code or app.", sortOrder: 9 },
  { id: "winterset", name: "Winterset Dog Park", city: "Winterset", groupId: "paid-single", blurb: "Needs Winterset\u2019s own code or app.", sortOrder: 10 },
  { id: "paws-and-pints", name: "Paws & Pints", city: "Des Moines", groupId: "paid-single", blurb: "Private park. Confirm hours and their app before you go.", sortOrder: 11 }
];
var HERE_MS = 45 * 60 * 1e3;
var CONSIDERING_MS = 45 * 60 * 1e3;

// worker/index.ts
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var PARK_IDS = new Set(PARKS.map((p) => p.id));
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json, "json");
function displayName(nickname) {
  const trimmed = nickname?.trim() ?? "";
  return trimmed.length > 0 ? trimmed.slice(0, 24) : "Anonymous";
}
__name(displayName, "displayName");
function sanitizeNickname(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().slice(0, 24);
  return trimmed.length > 0 ? trimmed : null;
}
__name(sanitizeNickname, "sanitizeNickname");
function isActive(row, now) {
  return row.expires_at > now;
}
__name(isActive, "isActive");
async function listActive(kv, now) {
  const listed = await kv.list({ prefix: "v:" });
  const rows = [];
  for (const key of listed.keys) {
    const row = await kv.get(key.name, "json");
    if (row && isActive(row, now)) rows.push(row);
    else if (row && !isActive(row, now)) await kv.delete(key.name);
  }
  return rows;
}
__name(listActive, "listActive");
async function getVisitor(kv, visitorId, now) {
  const row = await kv.get(`v:${visitorId}`, "json");
  if (!row || !isActive(row, now)) {
    if (row) await kv.delete(`v:${visitorId}`);
    return null;
  }
  return row;
}
__name(getVisitor, "getVisitor");
async function parkPayload(kv, visitorId) {
  const now = Date.now();
  const active = await listActive(kv, now);
  const mine = visitorId && UUID_RE.test(visitorId) ? await getVisitor(kv, visitorId, now) : null;
  return PARKS.map((park) => {
    const rows = active.filter((row) => row.park_id === park.id);
    const here = rows.filter((row) => row.status === "here");
    const considering = rows.filter((row) => row.status === "considering");
    return {
      id: park.id,
      name: park.name,
      city: park.city,
      groupId: park.groupId,
      groupLabel: GROUP_LABELS[park.groupId],
      blurb: park.blurb,
      hereCount: here.length,
      consideringCount: considering.length,
      visitors: rows.map((row) => ({
        name: displayName(row.nickname),
        status: row.status
      })),
      myStatus: mine && mine.park_id === park.id ? { status: mine.status, expiresAt: mine.expires_at } : null
    };
  });
}
__name(parkPayload, "parkPayload");
async function handleApi(request, env) {
  const url = new URL(request.url);
  const kv = env.ACTIVITY;
  if (url.pathname === "/api/health" && request.method === "GET") {
    return json({ ok: true });
  }
  if (url.pathname === "/api/share" && request.method === "GET") {
    return json({ url: url.origin, urls: [url.origin] });
  }
  if (url.pathname === "/api/parks" && request.method === "GET") {
    const visitorId = url.searchParams.get("visitorId") ?? void 0;
    return json({ parks: await parkPayload(kv, visitorId), serverTime: Date.now() });
  }
  if (url.pathname === "/api/status" && request.method === "PUT") {
    const body = await request.json().catch(() => null);
    const visitorId = body?.visitorId;
    const parkId = body?.parkId;
    const status = body?.status;
    const nickname = sanitizeNickname(body?.nickname);
    if (typeof visitorId !== "string" || !UUID_RE.test(visitorId)) {
      return json({ error: "A valid visitor id is required." }, 400);
    }
    if (status === "none") {
      await kv.delete(`v:${visitorId}`);
      return json({ parks: await parkPayload(kv, visitorId), serverTime: Date.now() });
    }
    if (typeof parkId !== "string" || !PARK_IDS.has(parkId)) {
      return json({ error: "Unknown park." }, 400);
    }
    if (status !== "here" && status !== "considering") {
      return json({ error: "Status must be here, considering, or none." }, 400);
    }
    const now = Date.now();
    const existing = await getVisitor(kv, visitorId, now);
    const keepTimer = body?.resetTimer === false && existing !== null && existing.park_id === parkId && existing.status === status;
    const ttl = status === "here" ? HERE_MS : CONSIDERING_MS;
    const row = {
      visitor_id: visitorId,
      park_id: parkId,
      status,
      nickname,
      expires_at: keepTimer && existing ? existing.expires_at : now + ttl,
      updated_at: now
    };
    await kv.put(`v:${visitorId}`, JSON.stringify(row));
    return json({ parks: await parkPayload(kv, visitorId), serverTime: Date.now() });
  }
  return json({ error: "Not found." }, 404);
}
__name(handleApi, "handleApi");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
