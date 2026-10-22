# SEO implementation status — 2026-10-22

## Delivered in source

Binding rules live in `rules.md` and are referenced from the repository's `AGENTS.md`. The strategy now uses an owned production domain, three dedicated service routes and international remote clients.

The new static Astro application under `site/` provides a homepage, service hub, three substantive engagement pages, Writing index, six recovered full articles/slideshow transcripts, Work, About, Experience, Contact and Privacy. Content, navigation, article links and service enquiry links render as initial HTML. No client JavaScript is necessary to read them.

Each page has a specific title, description, H1 and documented primary intent. Production URL configuration drives canonicals, social URLs, factual Person/Article/Service/ProfilePage/BreadcrumbList data, RSS and sitemap. A shared published-content registry and strict real-date policy prevent draft/future entries and fix the December 2023 versus 2019 ordering defect. Preview/error pages carry noindex, previews have an empty sitemap and no advertised sitemap, and Cloudflare preview response headers also prohibit indexing.

Original article dates, code and source links are retained; recovery normalizes trailing whitespace. Recovery provenance records hashes and image extraction. Brain-region visualization links directly to the original full publisher article; its HTTP 403 prevents local recovery. Historical technical work is explicitly distinguished from deployed business-agent outcomes.

Original media needed by generated pages and seven historical downloads are copied into build output, with noindex headers on those historical downloads. The old robots file is intentionally excluded: the migration inventory classified it as a text download, but it must not overwrite new crawl controls. Eight known legacy routes have new-host HTTP redirect rules. The existing preservation inventory and six-URL baseline are unchanged. This is partial migration, not coverage of all 148 old HTML URLs.

## Verification record

Local verification passed: zero type-check errors/warnings/hints, 13 Node tests, seven preservation tests, preview build and production-mode fixture build. A missing-domain production build fails as intended. Chromium verified the service/contact journey, article links/Back, JavaScript-disabled reading and a genuine HTTP 404. The 390px layout had no horizontal overflow. Lighthouse simulated mobile measured LCP 2451 ms, CLS 0 and TBT 0 ms; performance 98 and automated accessibility 100. Intentional preview noindex lowers its SEO score to 66. No field INP or rankings were measured. See `research/verification/seo-foundation/` for evidence, capture limitations and reproduction instructions.

## Outstanding gates and work

- **Domain:** Matthew prefers `mattoldach.ai`. Public RDAP returned no record on 2026-10-22; registrar availability/pricing and ownership remain unconfirmed. See `domain.md`. No purchase or DNS change has occurred. Production configuration remains unset until ownership is established.
- **Visuals:** the book now opens in 3D by default, with richer paper geometry/materials and distinct chapters. All seven Writing entries have visual cards and ordinary links. The mandatory deformable portrait, Canvas fallback, keyboard/touch controls and pointer-film effects are implemented and browser-checked. Final art/chapter review remains open. See `../visual-media.md`.
- **Content:** recovered bodies need full editorial/attribution review; all original external links and embedded media need review. Complete case studies, current résumé, Pagefind and remaining migration destinations are pending.
- **Contact:** direct email works as a normal mail link. Formspree setup, form states and owner-approved real delivery testing remain pending. No fabricated successful submission is shown.
- **Media:** the homepage clips have posters, controls and visibility/reduced-motion handling; older article animated/external embeds still require posters, playback controls, captions where relevant and reduced-motion/offscreen behavior before launch. Some legacy media relies on original external hosts.
- **Validation:** complete WCAG 2.2 AA manual/screen-reader review, Safari, real iPhone/Android, graphics/context-loss tests and deployed performance remain pending. Browser emulation is not device verification. Lighthouse laboratory results cannot establish field INP or search rankings.
- **Hosting:** no Cloudflare connection, public preview, production deployment, old-host forwarding or DNS change has occurred. Final production approval is still required.
- **Search:** Search Console owner verification, sitemap submission and representative URL inspection require the selected domain and account access. SEOcrawl authentication is unresolved and optional. No rankings, search traffic or lead attribution are claimed.

## Post-launch measurement plan

At approximately 4, 8 and 12 weeks after the approved launch, review indexing issues, non-branded queries relevant to each engagement, service-page clicks and attributable qualified enquiries. Establish real baselines rather than substituting the six-URL technical sample for search performance. Initially publish one substantial practical guide per month: workflow selection, agents versus ordinary automation, then handover. Choose later topics using actual search/client evidence. No scheduled jobs, paid accounts or outreach have been created.

## Visual/media update

The newer homepage verification supersedes the foundation-only figures above: 14 Node tests pass, type checking and preview/production fixture builds pass. The on-demand 3D book, imagery and video version measured local mobile LCP 2259 ms, CLS 0.00169 and TBT 0 ms (Lighthouse performance 99, automated accessibility 100). See `../../research/verification/visual-media/`. Actual graphics activation/frame rate, final art, full accessibility and real-device acceptance remain open.

## Default-3D and portrait update

The latest browser evidence is in `../../research/verification/interactive-polish/`. It supersedes the click-to-open default above: all seven Writing entries remain initial HTML links; Three.js now starts automatically on Home, while the portrait loads on request. Keyboard, touch emulation, reduced motion, Canvas fallback, book context restoration and mesh article/Back checks pass. The old Lighthouse 99 does not apply to automatic 3D startup; use the new measurement and limitations in that folder. No production indexing, domain ownership, real-device performance or ranking result is claimed.

The default-3D mobile laboratory run measured performance 95, automated accessibility 100, best practices 100, LCP 2409 ms, CLS 0.00215 and TBT 183.5 ms. Preview noindex intentionally yields SEO 66. This covers startup of the opening scene, not every chapter's first assembly or real-device interaction/field INP.
