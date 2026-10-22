# SEO foundation verification — 2026-10-22

Tested the local non-indexable preview at `http://127.0.0.1:4321/`, not a deployed site. The desktop image is a full-page capture; the mobile image is a viewport capture at 390×844. Full-page mobile captures omitted a decoded book image, so those captures were rejected; the viewport capture shows the rendered poster. Neither image demonstrates WebGL or physical-device behavior.

- `browser-results.json`: Chromium/Playwright CLI visitor journey, article destinations, Back, keyboard skip link, 390px document width, JavaScript-disabled service/article rendering and genuine HTTP 404.
- `lighthouse-mobile.json`: Lighthouse 13.5.0 simulated-mobile run after correcting low-contrast service numbering and preloading self-hosted fonts. Performance 98, automated accessibility 100, best practices 100. LCP 2451 ms, CLS 0, TBT 0 ms. INP was not measured. SEO 66 reflects the intentional preview `noindex`; this is not a production SEO/ranking score.
- Type check: zero errors/warnings/hints. Node tests: 13 pass. Preservation tests: seven pass and inventory check unchanged.
- Preview production build: passes all local metadata/content/link validation, 17 content pages plus a noindexed 404.
- Production-mode test build: passes using a nondeployed fixture origin, including canonicals, schema, sitemap and robots. This does not approve or establish ownership of that origin. Missing-domain production build fails before generating output.
- Production dependency audit reported zero vulnerabilities at the test date.

To reproduce browser checks, first build and serve the app, then run the installed Playwright skill's `playwright_cli.sh -s=website-seo open http://127.0.0.1:4321` and `playwright_cli.sh -s=website-seo run-code --filename ../research/verification/seo-foundation/browser-check.js` from `site/`. The script captures screenshots as well as returning measurements; inspect every capture before accepting it. The wrapper invokes the Playwright CLI, not a tracked application dependency.

Remaining full accessibility, Safari, real phone, graphics/media, contact-delivery, migration, deployed performance, Search Console and production approvals are listed in `docs/seo/implementation-status.md`.
