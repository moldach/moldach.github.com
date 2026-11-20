# Work miniature finish v1

Review-only asset set at `/review/work-finish/`. Main chapter assets are unchanged.
The original Work source, render and GLB remain in `research/models/work/`.

## Reproduce

1. `blender --background --python tool/assets/build_work_finish.py -- enhanced`
2. Put Khronos KTX-Software 4.4.2 `toktx` on PATH. The tool must be able to locate
   its matching `libktx.4.dylib` on macOS. No global installation is required.
3. From `site/`, run `npm run assets:work-finish`.
4. Run `npm run check`, `npm test`, the preview build and production-fixture build.
5. Serve the isolated preview directory on port 4327, then run
   `tool/assets/verify_work_finish.js` through the project's Playwright CLI.
   The script uses this stable build rather than the shared hot-reloading server.

The enhanced Blender source produces both WebGL tiers; compact geometry is
simplified with locked borders and smaller surface/image textures. Normal and
roughness maps are original deterministic surface data. No studio lighting,
highlights, ambient occlusion or cast shadows are baked into them.

## Construction standard

One authored unit represents approximately 5 cm of the miniature book. Paper,
cardstock, cloth, photographic print, bare metal, painted metal, plastic, wood,
vegetation and glass have distinct semantic material IDs. Surface UVs use a
consistent 2 repeats per unit; original project-image UVs remain independent.
`tool/assets/miniature_materials.py` is the reusable surface library.

The Work scene uses explicit basket, device and map-chart hinge groups with
unit scale in resting and folded poses. The grass/mulch plinth and already-flat
contour layers remain attached to the paper. Semantic project links and chapter
IDs survive batching and compression.

Adaptive tier choice is fixed for the canvas lifetime: compact at ≤768px,
coarse primary pointer or reported device memory ≤4 GB; enhanced otherwise.
The fixed Studio settings are exported from `finish-policy.mjs` into the asset
manifest. There are no visitor lighting controls. Enhanced shadows use 2048²;
compact uses 1024². WebGL and texture failures retain the poster and HTML links.

The CPU texture estimate counts uncompressed RGBA plus mipmaps conservatively;
it is not a driver allocation measurement and excludes environment/shadow maps.
KTX2 and conventional asset byte sizes are listed separately in the manifest.
Actual browser resource timings record encoded and transferred sizes, including
cache effects. Physical devices remain unverified unless separately recorded.

The review route and finish asset directory must be absent from production output.
Browser approval is pending; Blender renders and automated checks do not grant it.

## Candidate measurements and exceptions

The enhanced shared-book + Work payload is 7,834,600 bytes (7.83 MB), with a
conservative 31,542,325-byte model texture estimate. Compact is 5,210,588 bytes
(5.21 MB), with a 9,227,317-byte texture estimate. The compact download exceeds
the initial 4 MB target by 1.21 MB. Its explicit, unapproved review exception is
recorded in the manifest; the original target has not been silently raised.
The retained detail includes individual basket links, map boundaries and text.
Conventional-texture fallback downloads are 9,752,872 bytes enhanced and
5,512,692 bytes compact; both exceed their corresponding initial download
targets. They are compatibility fallbacks, not the normal KTX2 delivery path.

Blender uses a transmissive optical lens. The browser models this very thin
cover as a transparent physical material with clearcoat, avoiding a blurred
transmission render of the entire scene. Both use dynamic reflections; neither
uses painted highlights. This is a documented rendering approximation.

The first browser pass passed project-link metadata, forward/reverse turns,
touch, reduced motion and poster/ordinary-link fallbacks without JavaScript or
WebGL. It exposed a missing initial-load retry action, now implemented by
disposing the failed canvas and mounting a fresh one. Final browser verification
must be recorded separately from that first pass.

The local machine experienced load averages above 350 during final validation.
Frame timing from this run is a contention-affected laboratory observation, not
a physical-device performance claim or a representative benchmark.

## Browser evidence, 26 October 2026

`browser-results.json` contains the complete final automated browser run.
`captures/` contains the actual WebGL full spread, basket/device/map material
close-ups, compact view and four sampled folding poses. The basket and map-chart
hinges were raised on fixed bearings after the first pass to clear their mounts.
The screen is sharp with the thin-cover glass treatment.

| Measurement | Enhanced desktop | Compact mobile emulation |
| --- | ---: | ---: |
| Settled Work draw calls, including shadows | 125 | 125 |
| Settled Work rendered triangles, including passes | 511,433 | 446,217 |
| Peak calls with unchanged Services comparison | 168 | 168 |
| Turn frame interval median | 16.7 ms | 16.7 ms |
| Turn frame interval p95 | 33.4 ms | 50.0 ms |

Work itself meets the 150-call target. The original Services model is retained
for comparison and exceeds it; its refinement is outside this delivery. Frames
are measured during animation, not averaged with on-demand idle time.

Passed: all three project destinations, forward/reverse turns, conventional
texture fallback, touch, reduced motion, immediate keyboard navigation, fixed
tier across resize, no-JavaScript and no-WebGL posters/links, initial-load failure
and retry, and resource disposal. A separate live browser check opened PuttPulse
and returned with Back to the settled Work review URL. No page errors occurred.
The sample poses are visual evidence, not a proof of collision-free geometry
at every possible inspection angle.

The editable final `.blend`, GLBs and surface maps are included. `spread.png`
is the first Blender material baseline, before the hinge-clearance refinement.
The final review images are browser renders. The subsequent Cycles rerender was
stopped during severe host contention; offline close-ups are not claimed as
completed. Run `export_work_finish.py -- --render` to reproduce those from the
saved source. Browser visual approval and physical-device testing remain open.

Additional lifecycle checks passed latest-request navigation, simulated document
visibility pause/resume, and an actual `WEBGL_lose_context` loss with poster
fallback and resource disposal. See `lifecycle-results.json`. This does not
claim physical-device backgrounding behavior.

All 29 tests and both final preview/production-fixture builds passed. Production
excludes the review route and finish asset directory. The production origin was
a local build fixture, not evidence of domain ownership or deployment. The shared
working-copy type check reported two errors in concurrently edited
`src/components/fruit-four/runtime.ts` (nullable root and Move.transfers); that
work is outside this change and was not modified or staged here.

The staged candidate was separately type-checked in an isolated source snapshot:
40 files, zero errors/warnings/hints. This excludes unrelated unstaged game work.
Build logs are retained with trailing whitespace normalized.
