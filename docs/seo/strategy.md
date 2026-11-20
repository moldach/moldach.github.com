# International consulting SEO strategy

22 October 2026. Matthew selected **international remote clients** as the priority market. This is a build and editorial plan; it does not claim that the unbuilt replacement is indexed, performant or ranking. Apply the installed `seo-plan` consultancy template and relevant `seo-technical` checks in proportion to a personal consulting site, with Google's current documentation as authority.

## Objective and baseline

Attract relevant small-business owners and operators seeking practical AI, workflow automation, agent implementation and team adoption. Preserve the employer-facing engineering evidence and existing technical writing. Prioritize qualified enquiries over unrelated blog traffic.

The [six live public URL samples](current-site-sample-2026-10-22.json) establish the following configuration issues:

- Homepage returns HTTP 200 but has canonical `https://example.com/`, title “Silicon Valley Chronicles | Academic” and a default Hugo theme description.
- Sampled UMAP, Fitbit and brain project pages also return HTTP 200 with `example.com` canonicals. The UMAP description is blank.
- `robots.txt` points to `https://example.com/sitemap.xml`; the actual sitemap includes `example.com` URLs and template/demo paths.
- Separately, the complete preserved-source inventory records 108 placeholder-canonical pages and nine pre-existing missing local targets. The site's internal search index omitting newer posts is an internal-search defect, not evidence of Google's index state.

Actual Google indexing, current query positions, clicks, impressions, conversions and Core Web Vitals field data are **unverified**. No ranking score or traffic forecast is assigned. Wrong canonical signals deserve repair, but their presence alone does not prove what Google selected or why traffic was low. [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## Hosting and domain decision

GitHub Pages/static hosting is not intrinsically incompatible with search discovery. Google's JavaScript guidance explicitly supports pre-rendered HTML; GitHub Pages also supports owned custom domains. The old site's observed problems are configuration/content evidence, not proof of a host-level ranking penalty. Cloudflare remains the planned host because it suits deployment and new-host redirect/header controls, not because moving there guarantees higher rankings. [Google rendering guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [GitHub custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).

Matthew has now chosen **owned-domain-first public launch**, replacing the earlier pages.dev-first default. The domain itself is not selected. Require it as explicit production configuration and fail production builds when it is missing or is a placeholder/provider-preview address. No purchase or DNS change is authorized by this document. Previews remain non-indexable; only the approved production version enters the sitemap. Moving URLs needs its own migration checks and may cause temporary search fluctuations. [Google site moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).

## Search intent and page ownership

English is the initial publication language. Explain remote engagement and international availability honestly. Do not manufacture city offices, geographic doorway pages, testimonials or client sectors. Local map-pack/Business Profile work is outside this international-first plan. Add other languages only when complete maintained translations exist; do not add speculative hreflang tags.

These are research seeds, **not measured keyword volumes, difficulty scores or guaranteed positions**. The [five-site competitive sample](competitive-reference-sample.md) confirms overlapping service language exists; it is not a country-specific Google rank-tracking study.

| Intent | Primary destination | Content that must answer it |
|---|---|---|
| AI consultant for small business; remote AI consulting | `/` and `/services/`, with distinct page purpose | Who Matthew helps, problems addressed, capabilities, remote working process, credible evidence and a clear enquiry action. Keep the visual headline but include a plain-language offer in HTML. |
| AI readiness assessment; identify business automation opportunities | `/services/ai-opportunity-assessment/` | How workflows are assessed, feasibility and human-review boundaries, deliverables and what happens next. |
| AI workflow automation; AI agent implementation consultant | `/services/ai-workflow-automation/` | Bounded scope, integration/testing approach, approvals, ownership, handover and ongoing costs where known. |
| AI training and adoption for small teams | `/services/ai-training-adoption/` | Intended audience, documentation, training approach and practical examples Matthew can support. |
| Evidence of engineering and delivery | `/work/<slug>/`, `/experience/`, `/about/` | Original contribution, status, technologies, constraints, evidence links and supported outcomes. Historical visualization work must not be described as a shipped business-agent deployment. |
| Technical learning and specific article topics | `/writing/<slug>/` | Full useful explanation, author/date/attribution and contextual related links. Fitbit, brain regions and UMAP keep their distinct technical relevance. |

Matthew chose **three dedicated service pages** linked from the Services chapter/hub. Give each a complete distinct explanation: audience/problem, deliverables/process, relevant evidence, remote collaboration, ownership/human review, pricing/scoping factors, genuine questions and an enquiry action. Avoid rigid word counts and keyword stuffing. Every article/case study can link to genuinely related services, without forcing unrelated commercial phrases into archival writing. [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

The binding project rules are [rules.md](rules.md). Preserve the selected homepage headline “Practical AI. Less busywork.” and explain the small-business consulting offer in adjacent HTML. Plan one substantive practical guide per month initially, with owner review before publication. Review indexing and relevant enquiries after launch and around weeks 4, 8 and 12; this is an editorial/review plan, not a scheduled automation.

## Build acceptance gates

| Gate | Required implementation and evidence |
|---|---|
| HTML before graphics | Astro emits complete primary text and meaningful `<a href>` links in the initial response. All chapters, service content and featured articles remain reachable with JavaScript/WebGL disabled. Book tabs and project/article hotspots complement these links. No interaction, intro movie or page turn is required for content discovery. |
| Metadata and URL consistency | Unique useful title/description, clear page heading, one intentional absolute canonical on the approved origin, consistent trailing-slash policy, correct status codes and genuine 404 behavior. Reject `example.com`, preview origins and unexpected hosts in production metadata, structured data, sitemap and robots declarations. |
| Sitemap and robots | Generate sitemap from the same published route/content registry as the site. Include only intended indexable canonical HTTP-200 pages; exclude drafts, future content, test/demo/template pages, search results and forwarding duplicates. Robots advertises the actual sitemap and does not block essential assets. |
| Structured data | Appropriate Person/ProfilePage, Article/BlogPosting and BreadcrumbList data only where the page supports it. Service markup may describe actual services but is not a promise of a Google rich result. Include verified values matching visible text; no invented address, reviews, ratings or results. Validate syntax and applicable Google eligibility separately. |
| Media and performance | Lazy-load the book/portrait islands and offscreen media; reserve dimensions, responsive optimized images, meaningful alt text, video posters, captions when needed and pause controls. LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms remain targets. Record lab evidence and field data separately; a low-traffic site may have no CrUX data. |
| Content and trust | Verified biography, original role/contribution, working contact details, honest project status, preserved publication dates, evidence-backed results and clear process. No padding, fake testimonials or programmatic location pages. |
| Migration | Test destination-specific old URLs, article media/downloads, status/canonical consistency and no redirect loops. Use server HTTP permanent redirects where supported. Old GitHub Pages uses destination-specific static forwarding/canonical/fallback pages per the accepted plan; a meta refresh/canonical is not the same as an HTTP 301. Prefer zero-delay forwarding and test actual crawler/browser behavior. |
| Production verification | Crawl the public candidate after approved deployment; check initial HTML, discoverability, sitemap URLs, robots, rendered/no-JS content, structured data and links. Owner verifies Search Console property and inspects representative URLs. Never describe local tests as confirmed Google indexing. |

[Google rendering and links](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [structured-data eligibility](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), [migration requirements](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).

## Editorial sequence

1. **Before launch:** finish the real services offer, About/Experience and evidence-backed PuttPulse/Shiny-filteRs/Hinuhinu case studies; recover Fitbit and brain-region full articles rather than publishing only their short project cards. Preserve UMAP and the useful archive.
2. **First new practical guide:** draft “How to choose a first AI workflow for a small business”, using a selection rubric and explicit feasibility limits. Link to opportunity assessment. This is proposed content, not an existing article.
3. **Next guide:** draft “AI agent or ordinary automation: how to choose”, with bounded examples, human approvals and maintenance considerations. Link to the build engagement; do not recreate the removed fictional Enquiry project as case-study proof.
4. **Adoption guide:** draft “What an AI automation handover should include”, grounded in Matthew's documented engineering practice. Include ownership, operating instructions, monitoring and review boundaries without disclosing employer/client material.
5. Review enquiry quality and real query data before expanding service pages or publishing further topics. Seek legitimate relevant references through useful public work; no purchased links, spam or automatic outreach. External messaging requires separate authorization.

## Measurement and review

Set up owner-verified Google Search Console for the canonical production origin, submit the correct sitemap and capture query/page/country/device baselines when data exists. Use the same property and date ranges for comparisons. Review after launch discovery and around 4, 8 and 12 weeks; these are planning checkpoints, not scheduled automations or promised ranking timelines. [Search Console workflow](https://developers.google.com/search/docs/monitor-debug/search-console-start).

Track branded versus non-branded impressions/clicks, relevant service-query visibility, intended-page index coverage, country/device distribution, and qualified enquiries. Average position depends on query mix/location/device; do not present it as one universal global rank. No numerical traffic/ranking targets until a real baseline and conversion definition exist. Search Console does not require adding visitor analytics scripts; any optional conversion analytics needs an explicit privacy/design decision. Keep the initial no-paid-analytics scope.

SEOcrawl can supplement measurement after account authorization works, but is not required for launch. Installing skills, adding schema or switching hosting cannot guarantee a high position. The commitment is to implement and verify the controllable foundations and iterate using real search and lead evidence.
