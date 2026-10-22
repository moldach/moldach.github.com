# Matthew Oldach — AI consulting website implementation

Approved brief: 2026-10-22. Tasks are tracked in [todo.md](todo.md). This document records the accepted implementation direction, not a claim that the website is complete.

## Outcome and audience

Replace the academic-blog homepage with a memorable consulting portfolio for small businesses seeking practical AI and agent workflows. Preserve a substantial writing archive and provide a clear experience/CV path for full-time hiring teams. Show what Matthew actually contributed, distinguish real work from demonstrations, and avoid unsupported client or ROI claims.

## Experience and design

- Premium paper workshop: warm ivory, ink, cobalt and restrained coral; expressive editorial serif plus a precise sans; original paper imagery and sophisticated lighting.
- Six-chapter interactive pop-up book: Start, Services, Work, Writing, About, Contact. Direct HTML navigation, previous/next, URL/history support, and readable destination pages remain accessible before graphics load.
- Original opening sequence assembles documents, code and data into a useful workflow; no borrowed astronaut choreography or game assets. Video is integral to opening and project storytelling, with posters, pause controls and lazy/offscreen playback.
- Mobile uses a simpler upright scene and normal vertical scrolling. Reduced motion skips cinematic transitions. No-WebGL/context-loss states retain complete content and navigation.
- REQUIRED footer portrait: supplied headshot opens a dialog with photo-textured mesh deformation, grab/hand interaction, bounded stretch, spring return, Reset, Close, Escape, touch and keyboard region controls. Provide an interactive Canvas 2D fallback. The supplied 200×200 image is a likeness reference, not a full 3D head.
- Thoughtbot informs structure, Every editorial quality, Metalab project emphasis, Section clear organization, and Lusion motion ambition. Personal interests may inform subtle mountains, strategy and disc-flight motifs.

## Routes and content

Routes: `/`, `/services/`, `/work/`, `/work/<slug>/`, `/writing/`, `/writing/<slug>/`, `/about/`, `/experience/`, `/contact/`, `/privacy/`. Preservation-only legacy material can live under `/archive/`; slide/download paths remain stable.

Services: opportunity assessment, focused implementation, team adoption. No invented rates. Initial featured work: PuttPulse, a reviewed public automation project starting with Shiny-filteRs, and a clearly labeled fictional enquiry-processing demo with human approval and no real sending.

Recover published HTML, source metadata, imagery, code, equations, captions, slides, PDFs and attribution. Preserve publication dates and change modification dates only for actual edits. Keep template/demo posts out of primary writing. Latest-writing ordering is descending publication date, independent of featured selections. Invalid dates fail validation; drafts and future entries are excluded consistently.

Article metadata: title, description, stable slug, publication date, optional modification date, topics, draft, optional cover. Case studies add role, status, evidence and supported outcomes. A shared chapter registry binds labels, routes and scenes.

## Stack and delivery

- Astro + TypeScript + Markdown/MDX collections; React islands for graphics; compatible stable React Three Fiber/Three.js; GSAP timelines; scoped CSS and shared tokens; Pagefind, RSS, sitemap and social metadata.
- Static Cloudflare Pages deployment, initially provider-assigned `pages.dev`, GitHub PR previews, `site/` build root and `dist` output. Pin compatible stable dependencies and commit lockfile when implementation begins.
- Formspree: name, email, optional company and workflow description; validation, progress, success/error states, spam protection and direct email fallback. Configure receiving address and service before launch; real delivery test needs owner approval.
- Self-host fonts. Record original/licensed asset provenance. Spoken demos need captions. No payments, visitor accounts, live chatbot or paid analytics initially.
- Bend remains model-level development verification; bind actual route validation to modeled destinations without weakening existing laws. Keep browser verification. REA is optional research tooling, not a runtime dependency.
- Existing personal GitHub history remains authoritative. Work in `codex/website-redesign`; new app under `site/`; preserve published root throughout development. Keep PuttPulse changes separate.

## Checkpoints and order

1. Preserve original revision; inventory every HTML page, asset and linked download; reconcile research and update documentation.
2. Finish reference review where accessible, disclose evidence gaps, generate exactly three independent visual mockups (desktop, mobile, portrait), and wait for Matthew's selection before UI implementation.
3. Prototype two book chapters and the actual-photo deformation, including keyboard, touch, reduced-motion and fallback behavior. Verify interaction feasibility before expanding scene assets.
4. Deliver Home → services → evidence-backed case study → contact as one usable vertical slice in a local preview.
5. Complete writing migration, work/experience, video and scenes, search/feed/metadata, and tested legacy destinations.
6. Review and approve the production candidate; deploy and verify the new host before separately activating GitHub Pages forwarding.

## Acceptance and rollout

Content regression: December 2023 writing precedes 2019 writing; template/draft/future/malformed-date behavior is tested. Every inventory destination must exist or have an explicit unresolved repair; retained asset hashes and downloads are verified.

Book, routes/back, portrait, form and media receive meaningful automated interaction tests and manual checks. Verify focus, keyboard, screen reader, contrast and WCAG 2.2 AA; do not claim automated checks alone establish compliance. Verify Chrome/Safari desktop and actual iPhone/Android before claiming physical-device coverage.

Target LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms. Essential text/navigation precede graphics. Load portrait resources on demand. Record measured results and remaining limitations.

Production requires Matthew's final approval. Cloudflare account connection, actual production URL and Formspree configuration remain launch prerequisites. GitHub Pages needs destination-specific static forwarding with visible fallback links; it cannot execute Cloudflare redirect rules. Preserve meaningful queries/fragments, verify old links after cutover, retain the original tag and previous deployment for rollback. A custom domain is a later change.
