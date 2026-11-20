# Brain article recovery — 23 October 2026

The obsolete Towards Data Science URL failed for the owner. The article survives in TDS Archive on Medium, with Matt.0’s byline and original October 31, 2018 date. Direct browser/HTTP access returned 403 in this environment, but the public author feed returned the full item, including 26 article images and six R code blocks.

Source: https://medium.com/feed/@MattOldach_65321
Article: https://medium.com/data-science/how-to-highlight-3d-brain-regions-2e6c15a35574

`brain-article-rss.xml` is the exact recovered item. `brain/images/` preserves all 26 original downloaded images; `brain/manifest.json` records URLs, dimensions and SHA-256 hashes. Local WebP derivatives are under `site/src/assets/recovered/brain/`. Text and code are recovered from RSS, with trailing code whitespace normalized, generated image descriptions, the malformed contributor-credit link repaired to its original encoded target, and the RSS syndication footer/tracking pixel omitted. Figure credit and John Muschelli attribution remain. No R code execution or present-day dependency compatibility is claimed.

Reproduce from `site/`: `node scripts/recover-brain.mjs`. Originals are cached, so subsequent runs need no network. This script does not depend on a live Medium page. The original date is preserved; no new modification date is invented.

The new local reading route is `/writing/highlighting-3d-brain-regions/`. The HTML Writing card, chapter exhibit links, preserved-model href compatibility mapping, future Blender exports and new-host legacy redirect all use this destination. The old published GitHub Pages tree is untouched.

Browser evidence in `research/verification/brain-recovery/` verifies all 26 images decode from the local origin, all three sections, six code blocks, attribution, no tracking pixels, book navigation, Back and JavaScript-disabled HTTP 200 reading. Type check, all 14 Node tests and preview build passed. This is local recovery and draft-branch work, not a production deployment.
