# Visual/media browser evidence — 22 October 2026

Local preview only, `http://127.0.0.1:4321/`. The default view is artwork; **Explore in 3D** loads the geometric prototype. Desktop captures are 1440px wide; the phone screenshot is viewport emulation at 390×844. Gallery/service/cinema captures show their individual elements, not a physical device.

- All six chapter controls selected the expected scene and ordinary destination.
- Mesh clicks reached the UMAP and Fitbit article routes and the exact external brain-article URL. The external publisher's reading availability is not established by successful navigation.
- Article Back restored the Writing chapter. Tab arrow keys selected Work.
- Mouse drag and keyboard rotation changed the rendered pixels while ambient motion was paused.
- Actual WebGL context loss showed the artwork; restoring the context showed the canvas. A separate WebGL-unavailable context retained the artwork and six ordinary chapter links.
- Touch-emulated chapter selection reached Work. This is not a real phone test.
- A project video played muted in view and paused offscreen. Reduced motion defaulted to a paused book and paused video. Source clips have custom Play/Pause/Open clip controls; native controls remain without JavaScript.
- JavaScript-disabled HTML retained the headline, three project links, three Writing exhibits and six chapter links.
- No horizontal overflow at 320, 390, 768 or 1024px in the browser check.
- Astro check: zero errors, warnings or hints. Node tests: 14 pass. Preview and production-mode fixture builds pass metadata/content/local-media/link checks. The fixture origin is not deployed or owned by Matthew.

Final Lighthouse 13.5.0 simulated mobile: performance 99, automated accessibility 100, best practices 100; LCP 2259 ms, CLS 0.00169, TBT 0 ms. SEO 66 is the intentional preview noindex. No field INP, ranking or production/browser-device claims follow from these scores. The measurement does not include a visitor's first 3D activation cost or sustained GPU smoothness.

An initial auto-starting 3D version produced 1266 ms TBT. Moving WebGL initialization to the explicit Explore button and reducing the licensed font download restored the reading-path budget. Actual mobile GPU/activation testing remains open.

Reproduce: build/serve from `site/`, open the local URL with the installed Playwright skill CLI, then use `run-code --filename ../research/verification/visual-media/visual-check.js` or `graphics-check.js`. The scripts emit browser results and captures; inspect captures before accepting them. The remaining manual accessibility, final art, portrait, media-source quality and launch gates are in `docs/visual-media.md`.
