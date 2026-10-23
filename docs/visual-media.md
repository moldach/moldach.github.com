# Paper-book fidelity and motion — 22 October 2026

**Current visual status:** Matthew rejected both the shallow relief and the independent opening prototype as matches for the reference. Neither is visually accepted. A new editable Services asset is being developed in Blender under `research/models/services/`; it is not integrated into the site. The existing app preview remains unchanged during this asset review. See that folder's README for render/export limits.


Matthew rejected the simplified procedural dioramas as a visual match for the selected book illustrations. The current renderer prioritizes those actual illustrations. This is a review build; final art and production approval remain separate checkpoints.

## Earlier relief implementation (retained on five chapters)

The default WebGL view uses the six selected chapter illustrations from `research/design/chapters/round-2/`, including the revised Fitbit/brain Writing image `04-writing-v2.png`. Services, Work and About therefore retain the magnifier/workflow/checklist, complete three-project display, and portrait/compass/hands/game-board/CV compositions in Matthew's reference. The rejected low-detail procedural scene builders have been removed.

Each illustration textures an authored 24,897-vertex relief mesh. Image-space depth regions raise the paper spread and salient props; the geometry supports restrained perspective inspection through pointer dragging and arrow keys. An orthographic reference camera and an unlit, encoded-colour shader retain the illustrated composition and baked lighting at rest. Escape restores that view. There is no idle camera drift changing the reference composition.

**This is artwork-textured 3D relief, not a reconstruction of independent, free-standing objects or their unseen sides.** Inspection is deliberately bounded to roughly ±6.3° horizontal and ±4.3° vertical. The textured page-turn sheet supplies a geometric transition, not a physical simulation of all paper mechanisms. Freely rotatable, independently animated dioramas matching the images would still require a dedicated full asset-modeling pass; do not describe this renderer as that completed work.

The little printed tags now have real keyboard/touch button targets positioned over them, replacing the duplicate external tag row. Each chapter retains an ordinary Open chapter link, and exhibit destinations also appear as HTML links. Writing raycasts reach the corresponding full article. Service, Work and About exhibits additionally link to their relevant pages/anchors. Back restores the selected chapter.

Only the selected chapter texture/geometry loads initially, with caching on later selection. Keyboard selection and reduced motion switch immediately. The pause control governs page turns. Background/offscreen handling suspends rendering, and missing/lost WebGL leaves the actual selected artwork and ordinary links available. Restored book contexts resume the mesh. Resources are disposed on non-preserved page exit or initialization failure.

The book images remain **concept illustrations**. Their illustrated charts, interfaces and terrain are not newly computed data, newly recorded product demos, or validated anatomical geometry. Writing/gallery/article source images and recovered article content remain distinct and unchanged.

## Pointer trail refinement

The oil-film shader is now substantially quieter: maximum shader opacity is 0.055 rather than 0.28 (about an 80% reduction), colour modulation is softer, and the head decays over 140 ms rather than 850 ms. Tail strength decays by 0.65 per step rather than 0.94. The animation clears and stops within approximately 500 ms of inactivity, replacing the previous 2200 ms window.

It still initializes on first pointer movement, stays behind content, captures no input, and is disabled for coarse pointers/reduced motion. Hover tilt, sheen and the bounded style-transfer video preview remain on the Writing cards. No Lusion assets or code are used.

## Retained experience

All seven eligible authored Writing entries retain their cards and original publication ordering; this is not a claim that all 148 legacy HTML URLs are migrated. The external brain article remains publisher-hosted. The required footer portrait retains its original-photo relief, glove dragging, bounded deformation, spring return, keyboard regions, reset, native modal/focus handling, touch support and Canvas fallback. The original 200×200 photograph remains preserved; it limits sharpness and does not supply unseen head geometry.

The homepage project videos retain source hashes/treatments in `site/public/media/provenance.json`, posters, explicit playback controls and visibility/reduced-motion handling. Historical Hinuhinu footage still contains cursor/player graphics. Legacy article media needs a separate launch review.

## Evidence and open gates

Current reference-view captures, source comparisons, geometry checks and browser results are in `research/verification/reference-fidelity/`. Earlier `interactive-polish/` captures and Lighthouse scores describe the previous renderer, not the current one. Browser emulation does not establish Safari, physical-device performance, full WCAG 2.2 AA conformance, field INP or rankings.

Outstanding: owner review of this artwork-relief approach, any required full modeled assets, complete accessibility/Safari/physical-phone checks, full case studies/current résumé, remaining migration, Pagefind, Formspree setup and owner-approved delivery, domain ownership, Cloudflare setup and production approval. Preferred domain remains `mattoldach.ai`; no purchase, DNS or production change has occurred.


## Opening-model correction — 22 October 2026

The owner rejected the relief as a substitute for the approved 3D book. Start now uses the independent-object prototype in `site/src/components/book/opening-model.ts` (relative to repository root), with perspective, lit materials and real prop raycasting. Other five spreads remain concept reliefs. This is **not visually matched or owner-approved**; see `research/verification/modeled-opening/README.md` and its fresh captures for the remaining differences and scoped checks. Earlier relief screenshots and Lighthouse measurements do not verify this prototype. Oil and portrait code are unchanged in this pass.


## Work asset study — 23 October 2026

The Work reference now has its own editable Blender scene and offline render in `research/models/work/`, authored by `tool/assets/build_work.py` with shared `paper_scene.py` helpers. PuttPulse includes the putting-only raised mulch bed and marker circle; Shiny-filteRs uses the original screen capture; Hinuhinu uses actual map imagery and source-derived boundary silhouettes with illustrative raised layers. Source hashes and material/export limits are recorded alongside the assets. This study is separate from browser integration, final visual acceptance and material baking. The app preview remains unchanged.
