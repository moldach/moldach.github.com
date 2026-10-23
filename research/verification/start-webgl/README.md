# Start dynamic-lighting verification — 23 October 2026

Current review: http://127.0.0.1:4322/review/start/ (local only). The existing homepage preview on port 4321 and its renderer are unchanged.

## Evidence

- [Matching-camera comparison](comparison.html): original Cycles baseline beside the actual optimized WebGL canvas.
- [Studio](start-webgl-studio.png), [contrast](start-webgl-contrast.png), [mobile emulation](start-webgl-mobile.png).
- [Browser measurements and test results](browser-results.json); export sizes and metadata in `../../models/start/webgl/asset-report.json`.
- Reproduction: `playwright_cli.sh -s=start-webgl open http://127.0.0.1:4322/review/start/`, then `playwright_cli.sh -s=start-webgl run-code --filename tool/assets/verify_start_review.js` from repository root. The script returns a result object only after all assertions pass. Its captures go to `output/playwright/`.

## Results

| Measure | Result |
|---|---:|
| KTX2 + Meshopt GLB | 6,201,924 bytes |
| Conventional-texture + Meshopt fallback | 3,258,124 bytes |
| Main draw calls, including review floor | 103 |
| Draw calls on shadow refresh, including all passes | 136 |
| Visible triangles, including review floor | 135,208 |
| Estimated compressed model texture memory + mipmaps | 5,988,752 bytes |
| Estimated fallback model texture memory + mipmaps | 23,791,845 bytes |
| Desktop 120-frame median / p95 | 16.7 / 16.8 ms |
| Mobile-emulation 120-frame median / p95 | 16.7 / 16.7 ms |

Both size and draw-call targets pass. Transfer sizes distinguish cached desktop responses from the cold mobile-emulation model request. Frame intervals measure foreground requestAnimationFrame scheduling plus render submission; they are not GPU timestamp queries, input-latency tests or sustained physical-phone benchmarks. Texture memory estimates exclude environment/shadow maps, poster/canvas buffers and driver overhead.

Verified in Chromium: all ten image IDs and six chapter IDs; studio/neutral/contrast changes; exposure visibly changes the image; keyboard rotation; Escape restores the reference camera; touch dragging changes the view; automatic fallback when the compressed-model request fails; poster after both model requests fail; no-WebGL and no-JavaScript poster with a usable article link; context-loss poster; Close disposes model/review resources, workers and controls and releases the context. Desktop page errors were empty. Renderer bookkeeping retains one internal geometry/texture entry after context release; zero driver allocation is not asserted.

Both GLBs report no glTF validation errors; Meshopt/KTX2 extensions are unsupported by that validator, so actual browser decode/render checks are recorded separately. The conventional asset also has informational non-power-of-two-image notices. See `gltf-validation.txt` and `fallback-validation.txt`.

Type checking, the existing 14 Node tests, preview content/metadata/media/link validation and a nondeployed production-fixture build pass. The production fixture uses `https://website-validation.fixture` only as test configuration; no domain ownership, DNS or deployment is implied. The review exists in preview output and is absent from production output/sitemap.

## Visual differences and remaining gates

The objects, source imagery, text and reference framing are preserved. AgX/PBR light response is not pixel-identical to Cycles: the background is more uniform, indirect bounce/contact shadows are simpler, and fibers/edges respond differently. Keycaps and print/photo overlays retain dynamic PBR shading but skip per-detail shadow passes to meet the budget; structural paper, mounts and terminal retain soft dynamic shadows.

Final owner visual acceptance, Safari, actual iPhone/Android checks and sustained thermal/GPU performance remain unverified. No homepage replacement, idle animation, page turns, exhibit hotspots or portrait changes are claimed. Those are subsequent integration work.
