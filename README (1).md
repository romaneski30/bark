# Bark — Des Moines metro dog parks

Coordinate dog-park visits without creating an app account. Visitors can select a park, optionally enter a nickname, and mark **Here**, **Considering**, or **None**. Active statuses last 45 minutes unless removed earlier.

[Open Bark](https://bark.romaneski30.workers.dev/)

## Architecture

```text
GitHub repository → Cloudflare Worker → browser interface
                            ↓
                     ACTIVITY KV storage
```

The recovered React frontend is served through the `ASSETS` binding. The Worker handles `/api/` requests and stores visitor-status records in the existing `ACTIVITY` namespace. Browser local storage holds the device's visitor ID, optional nickname, and selected park. The QR/share dialog links to the current website origin.

## Recovery status

This repository began as a verified recovery of deployed files, not an import of the original Cursor project or its earlier Git history. The original editable TypeScript/React source may still be on the home desktop. Prefer that original project for future frontend development when available; do not hand-edit the minified frontend bundle as a normal development workflow.

The runtime configuration is reconstructed from the inspected deployment and tested locally:

- Worker name: `bark`.
- Entry point: `worker/index.js`.
- Compatibility date: `2026-09-26`; no compatibility flags were shown.
- Public assets directory: `site`, bound as `ASSETS`.
- SPA fallback: missing frontend paths return `index.html`, matching the observed deployment.
- `/api/*` requests run the Worker first, not the SPA fallback.
- `ACTIVITY`: references the new namespace in the Cloudflare account containing the atlas. `remote: false` keeps local development from using production KV; it does not replace the production binding.

No deployed files or backend logic were changed while adding configuration. The recovery `manifest.json` identifies the imported Worker/HTML/JS/CSS bytes, not the later documentation or configuration files. Existing `readme.txt` preserves the earlier backup checkpoint and its limitations.

## Local use and verification

Use Node.js 22 or newer; `.node-version` pins the validated Node 22.14.0 runtime. Install the pinned dependencies using `npm ci`. `package.json` contains `private: true` solely to prevent accidental publishing to the npm registry—it does not change GitHub repository visibility or website access.

- `npm test`: synthetic in-memory backend tests; no network or production storage.
- `npm run check`: syntax checks, mock tests and a Wrangler dry run. This packages the Worker but does not upload it.
- `npm run dev`: local Worker runtime with local KV and local assets.
- `npm run deploy`: **publishes to Cloudflare**. Do not run until the target account, bindings and rollout have been reviewed.

Runtime/asset/API and browser checks were conducted locally using synthetic data only. The test code and its observed results are recorded separately; this repository has the backend mock tests, not a configured GitHub Actions suite. No production park/status API requests were made during validation.

## Hosting and future updates

Bark is hosted in the same preferred Cloudflare account as the air-brake atlas. Both projects' repositories belong to the `romaneski30` GitHub account. Bark uses Cloudflare Workers, whereas the atlas uses Pages.

The destination build and deployment succeeded, the public HTML/JavaScript/CSS matched the locally tested files, health/share endpoints were checked, and the owner confirmed that the new website looks correct. No production park/status API calls or synthetic visitor check-ins were made during automated verification.

Bark uses a new ACTIVITY namespace in the destination account. It started empty: visitor activity was not copied from the original account. The old Lavish Ounce hosting remains a fallback with automatic builds disabled; it is not the target for future updates.

The destination build settings are:

- Production branch: `main`.
- Root directory: `/` (repository root).
- Node.js: `22.14.0`, set using `NODE_VERSION` and `.node-version`.
- Build command: `npm run check` (uses the pinned dependencies installed from `package-lock.json`).
- Deploy command: `npm run deploy` (uses `wrangler deploy --keep-vars`, preserving dashboard variables).
- Preview builds: disabled until separate preview storage and resource isolation are reviewed.

To update Bark, save changes on a branch, run local checks, review the pull request, and merge into `main` when ready to publish. Commits to `main`, including documentation-only changes, trigger the destination production build. Unlike the atlas, Bark currently does not generate automatic branch previews.

Do not use the atlas's Pages workflow or `exit 0`/output-directory settings for Bark. Future deployments must target the preferred Cloudflare account and the ACTIVITY namespace in `wrangler.jsonc`. Sharing controls derive the new site address from the browser's origin; old externally shared links or saved QR images do not update automatically.

Cloudflare supplies build authorization; no API token is stored in this repository. The KV namespace ID is a resource reference, not an authorization credential. Do not place secrets or exported visitor records in the public repository.

## Important limits retained from the deployed app

This recovery deliberately preserves existing behavior rather than changing application rules:

- Park-list reads remove expired status records, so production `GET /api/parks` has storage side effects.
- Visitor IDs are browser-generated identifiers, not authenticated accounts.
- KV updates may be eventually consistent; rapid changes may not appear immediately to all visitors.
- The existing KV list routine reads one result page; comprehensive high-volume handling was not added.

A production rollback affects code/configuration, not necessarily data written during a deployment. Use isolated local or preview resources for test activity. Do not send fake check-ins into the live service as part of testing without an explicit plan.

## Contribution and AI assistance

The project was created with Cursor. This recovery and GitHub consolidation were guided and reviewed by the project owner, with AI assistance extracting deployed files, reconstructing configuration, and testing locally. This is not a claim of independent authorship of all generated code.
