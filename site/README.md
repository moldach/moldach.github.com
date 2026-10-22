# Website application

The crawlable Astro/TypeScript foundation for Matthew Oldach's consulting website. This is a review build, not the finished WebGL experience or an approved launch candidate. The published legacy root remains untouched.

## Local review

Requires Node >=22.23.4 and npm. From `site/`:

```sh
npm ci
npm run check
npm test
npm run build
npm run preview
```

Default builds are non-indexable. Services, article bodies and navigation render into HTML without JavaScript. The shared page registry drives navigation and published URLs; the writing collection preserves original dates and filters drafts and future entries. Images and fonts are served locally.

## Production configuration

Set `DEPLOYMENT_ENV=production` and `PUBLIC_SITE_URL=https://<approved-owned-domain>` in the production host environment only after Matthew selects and owns a domain. Missing, placeholder and provider origins fail validation. A syntactically acceptable domain is not proof of ownership or approval.

Cloudflare branch previews remain non-indexable even if production environment settings are inherited. No deployment, DNS, registration, subscription or Search Console changes are performed by these scripts. The build command is `cd site && npm ci && npm run build`; output is `site/dist`. Pin a compatible Node version in Cloudflare before connection.

A separate nondeployed test build can be generated with `SITE_BUILD_DIR=.verification/production`. This is solely for verifying production metadata using a fixture origin. Never publish the fixture.

## Content and migration

- Services: `src/content/services/`; articles: `src/content/writing/`.
- Rules: `../docs/seo/rules.md`; implementation evidence and open gates: `../docs/seo/implementation-status.md`.
- `scripts/recover-content.mjs` is a one-time source-recovery tool, not a build dependency. It preserves full source bodies and extracts embedded images; see `../docs/seo/article-recovery.json` for provenance and limitations. Builds work without fetching those original articles.
- The build mirrors referenced legacy media and seven historical downloads. It never overwrites generated endpoints. Eight known legacy routes receive Cloudflare HTTP redirect rules. Full migration coverage remains pending.
- The brain-region exhibit links to the original full article because the publisher denied automated retrieval. No local summary is presented as its full article.

## Interactive review build

The book opens in WebGL by default using the six selected paper-book illustrations on authored 3D relief meshes. It preserves their reference composition and baked lighting, with bounded depth inspection, geometric page transitions and actual controls over the printed tags. It is not a full reconstruction of independent objects or their unseen sides. Article/exhibit hotspots have ordinary HTML destinations; Back, reduced motion and graphics fallback remain available.

Writing retains all seven authored visual cards. Its oil-film pointer trail now uses about 80% less opacity and clears within roughly half a second. The footer portrait, hover video and other accessibility/media handling remain implemented.

See `../docs/visual-media.md` and `../research/verification/reference-fidelity/` for current behavior, limitations and evidence. Prior procedural-renderer captures/scores in `interactive-polish/` are historical. Final visual review, any full-model asset pass, Safari/physical phones, contact delivery, search, remaining content/migration and production gates remain open.
