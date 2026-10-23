# Website project instructions

<!-- NotebookLM guidance lives in skills/notebooklm/SKILL.md and applies only to explicit NotebookLM operations. -->

## Website and SEO changes

Read and follow [SEO implementation rules](docs/seo/rules.md) for content, routing,
graphics or deployment changes. Keep new application work in `site/`; preserve
the published root until approved cutover. Follow the site's package scripts for
checks, and distinguish implemented behavior from visual/device/deployment proof.

## Bend laws and proofs

For changes to the Bend model, laws, or proofs, read `docs/bend.md`, run
`bend guide` before writing Bend, and run `./tool/verify_bend.sh` after edits
and before committing. Do not weaken laws to make proofs pass. Keep the model
consistent when changing the represented behavior, and distinguish Bend model
proofs from verification of production code.
