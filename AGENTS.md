# Website project instructions

<!-- NotebookLM guidance lives in skills/notebooklm/SKILL.md and applies only to explicit NotebookLM operations. -->

## Bend laws and proofs

For changes to the Bend model, laws, or proofs, read `docs/bend.md`, run
`bend guide` before writing Bend, and run `./tool/verify_bend.sh` after edits
and before committing. Do not weaken laws to make proofs pass. Keep the model
consistent when changing the represented behavior, and distinguish Bend model
proofs from verification of production code.
