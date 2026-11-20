# Published-site migration inventory

Source revision: `ee63d5baa4d564b9e04062ebd335fb0895aeb225`.
Preserved locally as `archive/pre-redesign-2026-10-22`. Regenerate with `python3 tool/inventory_legacy.py`.

## Coverage

- 642 tracked files: 148 HTML pages and 494 assets/support files.
- 8 post pages, 16 project pages, 8 downloadable files.
- 39 generated search records, including only 2 post records.
- 108 pages have an example.com canonical URL.
- 9 distinct local targets were already missing from the published source.

The JSON manifest records every page, proposed destination, metadata, local/external references, every asset's SHA-256 and size, and pre-existing broken local references. References in HTML attributes are covered; CSS URLs and dynamically constructed script URLs still need runtime checking.

## Migration policy

Destinations are assigned, not deployed. Every page remains marked not-implemented and requires editorial review. Post dates are preserved, not replaced with the migration date. Template posts and supporting pages remain in an archive, outside primary writing. Historical project entries require review before becoming public case studies. Slides, downloads, and supporting assets retain their original paths. Duplicate destinations are intentional only for old landing-page aliases.

The archive is a preservation decision, not permission to republish third-party assets without their original attribution and terms. Do not copy legacy scripts into the modern app without review. Do not forward the old host before verifying the new destination.

## Posts and projects

| Existing route | Published | Destination | Disposition |
| --- | --- | --- | --- |
| `/post/blog-with-jupyter/` | 2023-11-04T00:00:00+00:00 | `/archive/post/blog-with-jupyter/` | retain-archive |
| `/post/drake/` | 2019-02-05T00:00:00+00:00 | `/writing/drake/` | migrate-writing |
| `/post/faststyletransfer/` | 2019-04-21T00:00:00+00:00 | `/writing/faststyletransfer/` | migrate-writing |
| `/post/getting-started/` | 2020-12-13T00:00:00+00:00 | `/archive/post/getting-started/` | retain-archive |
| `/post/` | Not supplied | `/writing/` | rewrite |
| `/post/ninjutsu/` | 2019-03-07T00:00:00+00:00 | `/writing/ninjutsu/` | migrate-writing |
| `/post/page/1/` | Not supplied | `/archive/post/page/1/` | retain-archive |
| `/post/rprofile/` | 2019-04-02T00:00:00+00:00 | `/writing/rprofile/` | migrate-writing |
| `/post/supervised-umap/` | 2023-12-06T00:00:00+00:00 | `/writing/supervised-umap/` | migrate-writing |
| `/post/writing-technical-content/` | 2019-07-12T00:00:00+00:00 | `/archive/post/writing-technical-content/` | retain-archive |
| `/project/3d-brain/` | 2018-10-31T00:00:00+00:00 | `/work/3d-brain/` | migrate-project-review |
| `/project/assembly/` | 2018-10-31T00:00:00+00:00 | `/work/assembly/` | migrate-project-review |
| `/project/fitbit-project/` | 2018-11-10T00:00:00+00:00 | `/work/fitbit-project/` | migrate-project-review |
| `/project/free-ride-world-tour/` | 2018-05-07T00:00:00+00:00 | `/work/free-ride-world-tour/` | migrate-project-review |
| `/project/gsea/` | 2018-03-10T00:00:00+00:00 | `/work/gsea/` | migrate-project-review |
| `/project/hinuhinu/` | 2019-11-23T00:00:00+00:00 | `/work/hinuhinu/` | migrate-project-review |
| `/project/` | Not supplied | `/work/` | rewrite |
| `/project/knowledge-is-beautiful/` | 2018-06-06T00:00:00+00:00 | `/work/knowledge-is-beautiful/` | migrate-project-review |
| `/project/optimal-clustering/` | 2019-01-30T00:00:00+00:00 | `/work/optimal-clustering/` | migrate-project-review |
| `/project/page/1/` | Not supplied | `/archive/project/page/1/` | retain-archive |
| `/project/page/2/` | Not supplied | `/archive/project/page/2/` | retain-archive |
| `/project/project-management/` | 2018-10-06T00:00:00+00:00 | `/work/project-management/` | migrate-project-review |
| `/project/reverse-axis/` | 2018-10-06T00:00:00+00:00 | `/work/reverse-axis/` | migrate-project-review |
| `/project/rselenium/` | 2019-01-31T00:00:00+00:00 | `/work/rselenium/` | migrate-project-review |
| `/project/shiny-filters/` | 2019-11-23T00:00:00+00:00 | `/work/shiny-filters/` | migrate-project-review |
| `/project/software-solutions/` | 2018-10-06T00:00:00+00:00 | `/work/software-solutions/` | migrate-project-review |
| `/project/supervised-umap/` | 2020-01-11T00:00:00+00:00 | `/work/supervised-umap/` | migrate-project-review |
| `/project/taster/` | 2019-11-23T00:00:00+00:00 | `/work/taster/` | migrate-project-review |
| `/project/vaporwave/` | 2018-10-31T00:00:00+00:00 | `/work/vaporwave/` | migrate-project-review |

## Known legacy defects

- The homepage's recent-post widget and search index omit newer posts. The original blogdown configuration is absent; its exact filtering/sorting cause remains unproven.
- Placeholder canonical domains must not be carried into the rebuilt site.
- Missing targets listed in the manifest predate this rebuild; resolve individually rather than asserting they were preserved.

## Remaining validation

- Recover and review article bodies, code, equations, captions, and attribution.
- Verify new destinations and each retained download against this manifest at build/cutover.
- Inspect externally hosted media and presentations in a browser; this inventory makes no external availability claim.
