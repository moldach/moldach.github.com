# Website design requirements

## Navigation and mockup presentation

Updated from Matthew's feedback on 22 October 2026:

- Desktop uses one horizontal navigation at the top. Do not add a left/right sidebar or a mobile preview strip.
- Latest feedback restores six physical paper chapter tabs on the book's lower fore edge: Start, Services, Work, Writing, About, Contact. These select and turn to a chapter; they are local book controls in addition to the site navigation. Keep all tabs reachable and give the active tab a distinct state. This supersedes the earlier blanket restriction on a repeated chapter-link row.
- Book Previous/Next controls, current chapter/page indicator, and Explore remain local interaction controls.
- Show desktop concepts across the full image width. Present mobile layouts separately, never as an attached right-hand strip that appears to be desktop UI.
- Show portrait-dialog states separately from the primary desktop view; the footer headshot still opens the required interaction.

## Selected art direction and chapter iteration

- Matthew selected the first editorial-workshop concept. Retain that overall layout and paper art direction.
- Produce a separate concept image for each of Start, Services, Work, Writing, About and Contact, and iterate the spreads before WebGL modeling.
- Each chapter needs its own composition, silhouette and subject. Share paper, cover, typography and light; do not repeat mountains, trees, code brackets or generic scenery across chapters.
- Remove the fictional Enquiry workflow from featured work and launch scope. Use existing articles and project evidence: PuttPulse, Shiny-filteRs, Hinuhinu, Supervised UMAP, Drake, .Rprofile and fast style transfer. Service illustrations are metaphors, not completed client projects.
- Use actual recovered imagery as textures and media sources in implementation. Generated concept reinterpretations are not product screenshots or proof of scientific results. Record asset origins and attribution before reuse.
- Plan each project's animation separately: real source video/GIF where available, textured articulated objects or bounded Three.js geometry otherwise. Do not represent a camera pan over an entire flat spread as the completed pop-up book.
- Writing's featured selection is now Supervised UMAP, Fitbit gamification and highlighting 3D brain regions. Replace Drake and .Rprofile in this spread only; those articles remain in the archive and can still inform Services. Use the actual Fitbit and brain project imagery. Preserve original titles/dates and recover full articles before rewriting them.
- Each Writing exhibit and its title must open its corresponding full article directly. A visual zoom alone is insufficient. Pair mesh hotspots with semantic HTML anchors, preserve keyboard/touch/no-WebGL access, navigate immediately under reduced motion and restore Writing on browser Back. Keep optional model-manipulation controls separate from the article link.
- The finished book must use real 3D geometry, folding pop-outs, page turns and selectable objects with camera movement. Static concept images or a flat image with a perspective transform do not fulfill this feature.
- Keep concept/review evidence separate from verified browser interaction and physical-device performance evidence.

## PuttPulse putting-area imagery

- Show one basket on a small raised bed of wood-chip mulch, with a wider grassy circle defined by small plastic marking-whisker tufts in the ground.
- No tee pad, rectangular slab/mat, driving-fairway composition, ball-golf green, flags or cones.
- Use the same putting-area anatomy wherever PuttPulse appears. The revised About scene uses strategy/board-game objects rather than another disc-golf miniature. Keep the factual caption “Disc golf practice product.” when describing PuttPulse.
- Consult actual course photographs and marker references; Olympus informs the wooded professional-course feel. Do not claim the stylized scene depicts a specific real hole.

## Search discoverability

- Primary consulting market: international remote clients. Include a clear plain-language offer and remote process in HTML; do not manufacture geographic offices or local landing pages.
- The book is a progressive enhancement. Main content, chapter destinations and article links must be present in pre-rendered HTML and discoverable without a page turn, movie or WebGL interaction.
- Use production-origin canonicals, meaningful metadata, generated sitemap/robots, appropriate verified structured data and optimized media. Keep preview/draft/template pages out of production indexing.
- Apply the [SEO acceptance gates](seo/strategy.md), including migration and Search Console verification. Rankings and indexing are measured outcomes, not guarantees from hosting or installed skills.

## Required interactive portrait

The face interaction is a required website feature, confirmed by Matthew on 22 October 2026. It must be included in design concepts and implementation acceptance criteria.

- Place Matthew’s headshot at the very bottom of the page.
- Clicking or activating the headshot opens an interactive portrait window.
- Provide a draggable hand or grab interaction that stretches and deforms the face, inspired by the playful face manipulation in Super Mario 64.
- Use Matthew’s supplied headshot as the likeness reference: `assets/reference/headshot.jpeg`. Preserve the original image.
- Include Reset and Close controls, Escape to close, and touch support.
- Provide an accessible alternative to drag-only controls and respect reduced-motion preferences while preserving access to the feature.
- Keep the interaction consistent with the site’s chosen art direction.

The reference is a single 200 × 200 image. It establishes likeness; it is not a completed 3D face model. The rendering method and any additional asset needs will be evaluated during prototyping.
