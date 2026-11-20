# Reference artwork fidelity — 22 October 2026

The current default book uses the selected chapter illustrations from `research/design/chapters/round-2/` as textures on authored relief geometry. Earlier `interactive-polish/` captures describe the rejected procedural dioramas and remain historical evidence.

The screenshots here are of the live WebGL renderer. `reference-source.png` is the same Services texture displayed as a browser image for comparison; `reference-canvas.png` captures the WebGL result at the reference angle. Rendering/resampling is not asserted to be bit-for-bit identical. The clean chapter captures move focus to the HTML destination; some comparison captures include a keyboard focus indicator. All six compositions were visually inspected.

**Scope:** a 24,897-vertex relief mesh with nonzero authored depth (opening scene maximum 1.65 world units), image-space exhibit raycasts, limited tilt, and a textured geometric page transition. This is not a full reconstruction of independent objects, unseen surfaces or physical pop-up mechanisms. Lighting/detail are baked into the supplied art. Full free-standing models would require a separate asset pass. Illustrated project/chart content remains concept art, not newly validated research or recorded product footage.

## Browser assertions

`browser-results.json` records the current runs:

- Default WebGL relief is active; every chapter loads and selects through its printed-tag control.
- Keyboard and pointer inspection change rendered pixels with matched focus states; Escape restores an identical reference-pose capture.
- Clicking the UMAP exhibit opens the actual full article; Back restores Writing.
- Losing/restoring the book WebGL context falls back to artwork and resumes rendering.
- At 390×844 touch emulation, all six chapter tags work and there is no horizontal overflow. The mobile image capture was refreshed at the final DPR cap of 2.
- Reduced-motion selection is immediate, with animated page turns disabled.
- Missing WebGL and JavaScript-disabled contexts retain all six ordinary chapter anchors and the source artwork.
- The reference run recorded no uncaught page errors.

Desktop is Chromium at 1280px; phone is Chromium emulation with DPR 2. Safari and actual phones remain unverified. These assertions do not establish full WCAG conformance.

## Subtle pointer trail

Maximum shader opacity changed from 0.28 to 0.055; colour variation is softer. Head decay is now 140 ms, tail retention 0.65 per step and the inactivity render window 500 ms. Reduced motion/coarse pointers disable it.

The PNG comparison in `oil-measurement.json` measured a maximum active colour-channel change of 6/255. At 650 ms after movement stopped, every channel matched the baseline again (maximum difference 0). `oil-active.png`, `oil-baseline.png` and `oil-idle.png` retain the checked captures. These are local lab observations, not timing guarantees under arbitrary device load.

## Validation and reproduction

Astro check: zero errors/warnings/hints; 14 Node tests pass. Preview and nondeployed production-fixture builds pass the existing metadata/content/media/local-link validator. Colour escape sequences and trailing whitespace were removed from copied build logs without changing their messages.

Build/serve from `site/`. Start the installed Playwright CLI session in `site/`, create `output/playwright/`, then use `run-code --filename ../research/verification/reference-fidelity/reference-check.js` and the modes script. Inspect captures before accepting them. The modes script emits the oil comparison captures; the recorded measurement was calculated from their RGB buffers with Sharp in the site's installed dependencies.

Current behavior and limitations: `docs/visual-media.md`. The production site, domain/DNS, contact delivery, legacy published root and PuttPulse remain unchanged. Visual approval, any full-model asset work, remaining migration/content and all production acceptance gates remain open.

Current Lighthouse 13.5.0 simulated mobile: performance 96, automated accessibility 100, best practices 100; LCP 2581 ms, CLS 0.00201, TBT 123.5 ms. Preview SEO 66 reflects intentional noindex. LCP remains slightly above the 2.5-second target; no field INP or physical-device claim follows. The report predates a final instruction-text/private-export cleanup that leaves the render path unchanged. See `lighthouse.json` and its compact summary.
