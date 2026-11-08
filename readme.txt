BARK — DEPLOYED-CODE RECOVERY BACKUP
Recovered November 7, 2026. This is a checkpoint, not a ready-to-deploy original Cursor project.

WHAT IS INCLUDED
- worker/index.js: the Worker bundle provided in chat. Logic and string values preserved; park-object formatting normalized.
- site/index.html: raw HTML retrieved from the public root URL.
- site/assets/index-rOLRG-AY.js: the frontend JavaScript file referenced by that HTML.
- site/assets/index-Drcq4jW3.css: the stylesheet referenced by that HTML.
- manifest.json: file sizes and SHA-256 checksums.
- verify-backend.mjs: test script that uses synthetic data and in-memory KV only.

WHAT IS NOT INCLUDED
- The original TypeScript/React source, dependency manifests/lockfiles and build commands from the home desktop.
- Prior Git revision history.
- Current Cloudflare deployment configuration, compatibility date/flags, secret values or KV namespace identifier.
- Stored visitor activity. No production KV records were read or copied.
- Source maps: the provided Worker mentions index.js.map, but that file was not supplied. The recovered frontend does not link a source map.

KEEP THE LIVE SITE IN PLACE
Do not upload this as a replacement deployment yet. The existing Worker has two bindings:
  ACTIVITY: an existing Cloudflare KV namespace.
  ASSETS: the website files.
Connecting an unconfigured recovery repository to automatic production deployment can change the app or its bindings. Preserve the current Worker, website address and storage while we prepare and review configuration.

RECOVERY VALIDATION
Raw file retrieval did not execute frontend JavaScript or call /api/parks or /api/status.
The backend's park-read routine deletes expired rows, so a GET to that API is not strictly read-only. It was NOT called on the real service.
Backend mock tests passed 11 checks, covering static routing, health/share, input validation, status updates/removal, timer retention and expired-row cleanup. All mutations were synthetic and in-memory.
Frontend JavaScript syntax checked. Every script/stylesheet reference in the recovered HTML is present. No additional module imports or CSS URLs were discovered. Browser integration testing and original-source rebuild have not been performed.

HOW TO RETAIN THE ORIGINAL PROJECT
The home desktop may still have the original Cursor folder. If available later, copy that folder safely (excluding secrets and generated dependency folders), inspect its Git history/remotes and build configuration, and prefer it for ongoing editing. This bundle is a fallback checkpoint, not a substitute for the original editable source.

NEXT CHECKPOINT
Inspect the existing Worker's Bindings configuration for the ACTIVITY namespace name/identifier and ASSETS configuration; also record its compatibility date/flags. Do not expose secrets or stored visitor data. Then prepare a repository/configuration that keeps the same existing Worker and bindings. Test without production storage writes before connecting production builds.

Do not delete the existing Cloudflare account, Worker, deployment or KV namespace.
