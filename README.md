# Matthew Oldach — website rebuild

Source of record for the published site and its replacement. The existing GitHub Pages output remains at the repository root. The new Astro application will live under `site/` after visual selection; it has not been scaffolded yet.

## Current state

- Working branch: `codex/website-redesign`; production branch: `master`.
- Original published revision: `ee63d5baa4d564b9e04062ebd335fb0895aeb225`.
- Preservation tag: `archive/pre-redesign-2026-10-22`.
- Preservation and inventory are implemented. Matthew selected the first editorial-workshop direction. The revised six concepts have physical paper tabs, distinct scenes and existing project/article references; they remain under review before WebGL modeling.
- No production hosting, DNS, redirects, or contact-service settings have been changed.

## Project records

- [Implementation plan](tasks/plan.md) and [delivery checklist](tasks/todo.md).
- [Migration report](docs/migration/README.md) and [complete inventory](docs/migration/inventory.json).
- [Design requirements](docs/design-requirements.md), including the required interactive portrait.
- [Resource library](docs/research/resource-library.md) and [twenty website references](docs/research/twenty-consulting-website-examples.md).
- [Design concept record](research/design/README.md).
- [Six chapter concepts and interaction notes](research/design/chapters/README.md), including the reference-grounded putting-area correction.
- [Existing source media and individual motion treatments](research/design/asset-motion-map.md).
- [Bend verification and its limits](docs/bend.md).

## Verify the preservation work

```sh
python3 tool/inventory_legacy.py --check
python3 -m unittest discover -s tool -p 'test_*.py' -v
./tool/verify_bend.sh
```

Python tooling uses only the standard library. The inventory is tied to the preservation tag, not the growing replacement tree. It records proposed destinations; it does not assert those destinations are implemented or deployed.

Keep raw email exports, private source provenance, account details, and browser screenshots containing unrelated tabs outside this public repository. Review historical résumé and employment information before presenting it as current.
