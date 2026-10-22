# Interactive visual experience — 22 October 2026

This review build responds to Matthew's request for default 3D, richer paper scenes, a complete visual archive and a playable portrait. Final art and production approval remain separate checkpoints.

## Book

The geometric Three.js book now opens automatically after the initial HTML/poster paint. No Explore click is required. The concept artwork stays available while textures and shaders load and remains the missing-WebGL fallback. Reduced motion still opens 3D, with ambient movement paused and immediate chapter changes.

The model has beveled cardstock props, paper-grain bump mapping, layered pages, stitched binding, gilt cover details, a printed blueprint spread and a coral bookmark. The opening workshop has a continuous textured film ribbon, terminal/keyboard, file tray, desk lamp and floating programming fragments. Other chapters use workflow boards, a putting basket with actual mulch chips and circle markers (no tee pad), three article exhibits, a strategy table with folded mountains confined to About, and a conversation table with cups, letter and plant. These are original illustrative models, not evidence of deployed client agents.

Chapter tags, page turns, pointer/keyboard rotation, pause, artwork switching and six ordinary route destinations remain available. UMAP, Fitbit and brain exhibits have both raycast hotspots and HTML article links. Back restores Writing. The brain exhibit uses the original rendering, not a claimed anatomical reconstruction.

Repeated shapes/materials are shared and rigid pieces batch by material; interactive hotspots and moving props retain separate objects. Only the initial chapter is assembled at startup; other chapter scenes assemble on selection and are cached, with stale selections ignored; ambient rendering is capped around 30fps, paused offscreen/in hidden documents, and reduced-motion transitions are immediate. Page turns can use the display refresh rate. Renderer/geometry/material/texture resources are disposed when leaving without page preservation. Missing/lost WebGL retains ordinary navigation; restored book contexts resume 3D.

## Writing gallery and pointer effects

All seven eligible authored entries now receive individual visual cards in original publication order. Template/demo content remains excluded. Each uses original article/project artwork, topics, year and a normal anchor to the full article. The publisher-hosted brain article remains external; navigating to it does not establish publisher availability. This is the complete current authored Writing collection, not a claim that all 148 legacy HTML URLs have been migrated.

The gallery uses large two-column media surfaces, with one column on phones. Fine-pointer hover adds bounded perspective tilt, image movement, a local reflective sheen and a Read affordance. The style-transfer card plays a silent four-second excerpt on hover, then stops; pointer exit, document hiding and reduced-motion changes stop it as well. Touch/reduced-motion modes retain still artwork and direct links.

On the first pointer movement, an original WebGL thin-film interference shader draws a localized iridescent pointer trail behind content. It fades and stops rendering after pointer inactivity; it neither captures input nor changes navigation. The shader is disabled for coarse pointers and reduced motion and stops when the document is hidden. It uses no Lusion assets/code. Reference review covered the supplied Lusion gallery screenshot and live motion/pointer captures; the Computer connection timed out after finding the tab, so an isolated browser was used for those captures.

## Required portrait

The footer headshot now opens a native modal dialog containing a photo-textured relief mesh. Pointer/touch grabs deform a local facial region with bounded displacement; release uses a damped spring (mass 1, stiffness 100, damping 10). A white glove follows the grab. Selectable nose, cheek, forehead and chin controls plus canvas arrow keys provide keyboard deformation; Space releases and Reset immediately restores the image. Escape/Close dismiss and restore trigger focus. The native dialog contains focus.

The actual supplied 200×200 image is preserved. A loading poster remains available while the interaction initializes; Three.js/portrait resources load only when requested. Missing or lost WebGL switches to a Canvas 2D textured-triangle deformation using the same displacement field. Reduced motion retains direct manipulation and restores immediately on release. Animation runs only during interaction/settling, not continuously in the footer.

This is a stylized dimensional photograph, not a fully reconstructed or freely rotatable head. The source resolution limits sharpness; a larger photograph can improve it later.

## Existing media and provenance

The homepage's Hinuhinu and style-transfer MP4 excerpts, poster frames, controls and visibility/reduced-motion handling remain. Source/output/poster hashes and treatments are in `site/public/media/provenance.json`. Hinuhinu retains cursor/player graphics from its historical recording; final-quality footage still needs a cleaner source. Legacy article animations/embeds need a separate launch review.

## Verification and remaining gates

Fresh browser scripts/results and inspected captures are in `research/verification/interactive-polish/`. They verify automatic 3D, all chapter controls, an actual mesh-to-article click and Back, book context loss/restoration, all seven archive destinations, hover tilt/video/idle trail, visible face deformation and spring return, keyboard/reset/Escape/focus/reopen behavior, Canvas fallback and Chromium touch emulation. JavaScript-disabled HTML retains all seven article cards. Type checking, Node tests, preservation tests and both preview/production-fixture builds are recorded there.

These checks do not establish Safari, physical iPhone/Android behavior, complete WCAG 2.2 AA conformance, sustained GPU frame rate, field INP, rankings or deployment readiness. Automatic 3D changes the startup performance profile; do not reuse the earlier click-to-open Lighthouse 99 as evidence for this version. The default-3D simulated mobile run measured performance 95, automated accessibility 100, LCP 2409 ms, CLS 0.00215 and TBT 183.5 ms. This measures opening-scene startup, not field INP or every chapter’s first assembly. See the fresh report and measurement limitations in the verification folder.

Final scene review, full case studies/current résumé, remaining legacy migration, Pagefind, Formspree setup and owner-approved delivery, domain ownership, Cloudflare setup and production approval remain open. Preferred domain: `mattoldach.ai`; no purchase, DNS or production change has occurred.
