# Visual and motion prototype — 22 October 2026

This pass responds to Matthew's feedback that the SEO foundation was too text-heavy. It is a reviewable visual prototype; neither the book artwork nor the full website is approved for production.

## Implemented

- The home page now leads into a visual project gallery, an editorial video section, illustrated engagements and three original Writing exhibits. Detailed service copy remains on the crawlable service routes.
- The initial book artwork loads immediately. **Explore in 3D** dynamically loads Three.js and a real geometric book: layered pages, covers, lights/shadows, pop-up props and six different scenes. The model is not a camera moving over a flat image.
- Paper tabs change the scene and turn a page; an ordinary Open chapter link reaches each full route. Pointer dragging and arrow keys rotate the view, Escape resets it, and motion can be paused. Keyboard chapter selection and reduced-motion mode switch immediately.
- Writing panels use the recovered supervised UMAP plot, Fitbit cover and brain illustration. Each panel has a raycast article destination and an equivalent HTML link. Back restores the selected chapter using the current history entry. The brain panel remains an image, not an unvalidated anatomical mesh.
- Work includes a procedural putting basket on raised mulch with circle markers, no tee pad, and the original Shiny-filteRs phone image. Other chapters use a workflow board, strategy table/photo and conversation/envelope scene. These are illustrative props, not a simulation of deployed business agents.
- Two existing project clips are self-hosted as silent MP4 excerpts. The Hinuhinu clip is cropped from the original recording to isolate the Oahu terrain renderer; it is not newly inferred terrain. Source/output/poster hashes and exact treatments live in `site/public/media/provenance.json`.
- Videos play when visible, pause offscreen/when the document is hidden, and retain explicit Play/Pause/Open clip controls. Reduced motion defaults to posters until requested. Without JavaScript, native video controls and all reading/navigation links remain available.
- Missing WebGL or a lost graphics context restores the concept artwork and normal chapter links. Context restoration resumes the 3D view. Geometry/texture/renderer resources are disposed when the page leaves without preservation.
- The phone layout brings the book above the supporting paragraph. The same licensed Newsreader family now uses a 24 KB single-weight font instead of the 132 KB variable font; fonts remain self-hosted.

## Performance decision

Automatic WebGL startup measured substantial blocking work on simulated mobile (1266 ms TBT in the initial run). The book now loads only after a deliberate request. This keeps the artwork, offer and navigation available while allowing a full 3D exploration. Loading UI is shown during initialization and shader preparation uses `compileAsync`.

The final local mobile run measured performance 99, automated accessibility 100, LCP 2259 ms, CLS 0.00169 and TBT 0 ms. The full Lighthouse results and browser evidence are in `research/verification/visual-media/`. These are laboratory checks, not field INP, physical-device performance, Search Console evidence or a ranking guarantee. The cost and smoothness of activating 3D still require real-device review.

## Review and remaining work

Review the composition, scene details, camera angle, page turns and video excerpts together. The current models are procedural prototypes; they do not mark all chapter concepts as visually approved. More detailed paper geometry, final motion art and a production accessibility/performance pass remain open. The Hinuhinu excerpt retains cursor/player graphics from its historical screen recording; replace that recording with the original render for final-quality project footage.

The required draggable-face portrait is still pending and remains required. Formspree, full case studies/current résumé, remaining legacy migration, Pagefind, Safari/real phones, domain ownership and production approval are separate open gates. Preferred domain: `mattoldach.ai`; see `docs/seo/domain.md`.
