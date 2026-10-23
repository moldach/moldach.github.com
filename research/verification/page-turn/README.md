# Start ↔ Services page-turn prototype — 23 October 2026

Historical isolated-prototype record. Subsequent owner-requested Home/Services integration and changed production asset retention are documented in `../integrated-book/README.md`.

Review: http://127.0.0.1:4322/review/page-turn/ (local only).

The review has one renderer, a stationary Start-derived cover/spine/page stack with six tabs, 15 independently folding Start assemblies and three Services assemblies. A segmented closed paper leaf has thickness, a curled turning silhouette and dynamic normals. Its geometry—not an image of a complete book—is rendered with fixed Studio lighting and updated cast shadows during motion. Resting scenes render on demand. The common camera reserves space for the elevated leaf; it is intentionally wider than the normal chapter-page camera.

Start and Services tabs turn in place without changing URL/history. Other four tabs keep normal destinations. A 1,600 ms timeline folds the outgoing assemblies during 0–450 ms, turns during 350–1,150 ms, and unfolds the incoming assemblies during 1,000–1,600 ms. Four stagger lanes use 60 ms offsets so all 15 Start assemblies fit the declared folding window. Services unfolds assessment → implementation → adoption. Keyboard/reduced-motion selection switches directly, including when Services has not loaded yet. Repeated clicks retain the latest requested destination. Document hiding pauses progress; controls cannot orbit during the turn.

The fold pose is a stylized hinge rotation with local depth/height compression. It is not a collision-simulated, mechanically engineered paper construction. Folded terminal/photo surfaces and the unprinted turning leaf are visible intermediate prototype states, not final authored illustration. Source Blender files, original GLBs, homepage/chapter renderers, legacy published tree and portrait are unchanged. Final visual acceptance is pending.

## Reproduce

From `site/`:

- `npm run assets:page-turn` rebuilds two separate Meshopt/conventional-texture GLBs and their manifest from preserved source GLBs. It reuses the existing surface-only paper normal. No light/shadow bake or reference screenshot projection is added.
- `npm run check` and `npm test` validate types, motion phases, finite geometry, one shared base, positive rig scales, all ten image IDs, six chapter IDs and three unique service destinations.
- `SITE_BUILD_DIR=.verification/page-turn npm run build` validates preview HTML, metadata, media and links.
- `DEPLOYMENT_ENV=production PUBLIC_SITE_URL=https://website-validation.fixture SITE_BUILD_DIR=.verification/page-turn-production npm run build` verifies exclusion using a synthetic, nondeployed origin. Review HTML and page-turn GLBs are absent; this implies no domain ownership, DNS change or deployment.

Browser scripts in `tool/assets/`: `verify_page_turn.js`, `verify_page_turn_lifecycle.js`, and `capture_page_turn_comparison.js`. Run with the existing Playwright CLI wrapper against port 4322. Captures originate from the browser; `?capture` enables the explicit `review-seek` event solely for deterministic phase screenshots.

## Evidence and limits

`browser.json`: forward/reverse turns, current tab, latest-click queue, unchanged history/URL, direct keyboard/reduced-motion selection, touch/mobile emulation, ordinary destination navigation, fallback without JS/WebGL, retry after Services failure, and zero page errors. Visibility pause uses a controlled document-visibility event fixture.

`lifecycle.json`: delayed keyboard request, resizing during a turn, pagehide disposal and actual `WEBGL_lose_context` poster/navigation fallback. Disposal calls cover geometries, materials, textures, controls, observers, frame callbacks, environment targets, shadow maps and renderer/context. GLTF decoding uses Meshopt without texture-transcoder workers; late timed-out model results are disposed.

`comparison.html`: existing and prototype scenes captured at matching 1488×992 stage size, camera [0.12,17,18], target [0,2,0], 48 mm. Baseline camera changes are response-only browser fixtures, not repository edits. Start rest composition closely matches the existing renderer. Services shares Start's stationary page stack and has minor surface/optimization differences from its standalone asset. Baseline and prototype tabs can show different keyboard focus rings. All six 25/50/75% phase captures and the mobile capture were visually inspected. Leaf clipping and blueprint intersection seen in the first pass were corrected before these captures. This is visual inspection, not owner acceptance or exhaustive collision proof.

Models: Start **3,322,308 bytes**, Services **1,074,788 bytes**, total **4,397,096 bytes**. `performance.json` records foreground RAF intervals: median **16.7 ms**, p95 **16.8 ms** in these runs, with maximum **166.6 ms** forward / **66.7 ms** reverse / **150 ms** mobile emulation. Peak **169 draw calls** and **481,564 submitted triangles** include repeated shadow submissions, floor and turning leaf; these are not unique mesh counts. Stalls remain a profiling concern before integration. Measurements are not GPU timers, real-user INP, Safari or physical-device results.

Verification: zero type-check errors/warnings/hints; **17 Node tests pass**; preview and synthetic production builds pass. Production has no review route, sitemap entry or page-turn model directory. Existing public pages remain the current implementation until owner visual approval of this prototype.
