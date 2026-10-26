# Default 3D, visual archive and portrait — 22 October 2026

Local review only: `http://127.0.0.1:4321/`. Desktop captures are Chromium at 1280px; phone captures are Chromium viewport/touch emulation at 390×844 with DPR 2. These are not Safari or physical-device results. The legacy published tree remains unchanged.

## Verified behavior

`browser-results.json` contains the assertion results from the four reproduction scripts:

- Default 3D opens without clicking an Explore button; all six chapters select and render. Rapid first-time selections keep the latest requested chapter.
- A real raycast click opens UMAP; Back restores Writing. Book WebGL context loss/restoration falls back and recovers.
- All seven eligible authored articles have visual cards and full-article destinations in publication order, including the external brain article. They remain anchors without JavaScript. External publisher availability is not inferred from a correct link.
- Hover produces a perspective transform; the style-transfer clip plays then stops. The oil-film shader changes rendered pixels and clears after idle. It initializes on first pointer movement, is disabled for coarse pointers/reduced motion and is decorative.
- Dragging the actual headshot changes rendered pixels; release springs back. Keyboard region selection/arrow deformation, Reset, Escape, explicit Close, reopen and trigger-focus restoration pass.
- Repeated Tab navigation remains in the portrait dialog. Losing its WebGL context retains focus and switches to a working Canvas 2D deformation.
- Forced no-WebGL: chapter anchors and concept artwork survive; the Canvas portrait deforms and springs back. Reduced motion starts the book paused and restores portrait deformation immediately on release.
- Emulated touch dragging deforms the portrait and returns after release. Phone chapter selection works. Writing has no horizontal overflow at 320, 390, 768 and 1024px.
- The refinement run reported no uncaught page errors. Automated checks do not establish full WCAG 2.2 AA conformance; screen-reader and manual contrast review remain launch gates.

Build logs retain their messages with terminal colour codes and trailing whitespace removed.

## Build evidence

- Astro check: zero errors, warnings or hints.
- Node tests: 14 pass. Legacy preservation inventory tests: 7 pass (`python3 -m unittest discover -s tool -p 'test_*.py'`).
- Preview build passes static metadata/content/media/local-link validation. Production-mode fixture build also passes using a nondeployed fixture origin; this is not domain ownership or deployment approval.
- Bend navigation/model files and registry routes were not modified in this pass. Existing model proofs are not claimed as browser/rendering evidence.

## Performance

Lighthouse 13.5.0, simulated mobile, default automatic-3D startup: **performance 95, automated accessibility 100, best practices 100; LCP 2409 ms, CLS 0.00215, TBT 183.5 ms**. SEO 66 reflects the deliberate preview noindex. See `lighthouse-summary.json` and the full `lighthouse.json` for settings, timestamp and audit details.

This measurement covers opening-scene startup. Other chapters build/cache on selection, and the portrait loads on request; their first-interaction latency, sustained GPU frame rate and field INP require separate real-device evaluation. Early versions that assembled every chapter at startup produced substantial blocking; the current version shares/batches static geometry and assembles only the opening chapter initially. The source subsequently received a dialog focus-boundary fix, a Services connector placement correction, an unused branch removal and a pointer-only shader refinement; these do not change the measured opening-scene assembly path. Do not reuse the prior click-to-open Lighthouse 99 for this default-3D version.

## Reproduce

Build/serve from `site/` using its package scripts. Open an isolated browser using the installed Playwright CLI skill. From `site/`, run `run-code --filename ../research/verification/interactive-polish/polish-check.js`, then the fallback, refinement and edge scripts. Capture paths use the CLI session's working directory: start the session in `site/` and keep `output/playwright/` available. Inspect image content, rather than accepting file creation as visual proof.

The portrait is a photo-textured relief from the supplied 200×200 reference, not a reconstructed full head. Final art approval, cleaner historical project footage, complete accessibility review, Safari/physical phones, remaining content/migration, contact delivery, domain ownership and production launch remain open. No deployment, DNS change, registration or paid service occurred.
