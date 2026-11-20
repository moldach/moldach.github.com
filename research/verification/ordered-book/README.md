# Ordered chapter turns — 2026-10-26

The main six chapter pages now share the animation renderer and physical order:
Start → Services → Work → Writing → About → Contact. Pointer/touch selection
turns one adjacent leaf at a time (1.6 seconds each), settling the destination
before navigating once. Intermediate chapters do not create history entries.
Latest selection is honoured after the current leaf finishes. Keyboard and
reduced motion switch directly. Source articles and other non-chapter links
retain ordinary navigation.

`browser.json` records actual Chromium journeys Start→About (four forward
turns), Contact→Services (four reverse turns), portrait opening, Writing
hotspots, keyboard and reduced-motion navigation. PNGs show the actual canvas.
`edges.json` confirms retargeting, Back, failed-intermediate retry, four reverse
turns with touch emulation and no-JavaScript navigation. An initial combined
edge run timed out on touch arrival; an isolated rerun and a complete rerun
both passed. Physical-device checks remain outstanding. The edge suite is `tool/assets/verify_ordered_edges.js`.

Reproduce exports with `cd site && npm run assets:page-turn`; original Blender
sources and baseline exports are unchanged. Start supplies the only book base
and six stationary tabs; other exports contain chapter content and explicit
hinges. Assets load on demand and are reused within a journey. Initial direct
chapter loads require Start's shared base plus the selected chapter, rather
than all six. The complete optional six-model cache is approximately 9.9 MB.

Measured peak across the two desktop journeys: 169 draw calls and 481,564
triangles, including shadow passes. This exceeds the earlier 150-call goal;
no claim of meeting that target or of physical-device performance is made.
Visual evidence is Chromium desktop; mobile checks use emulation.

Node tests cover all 36 source/destination pairs, including six zero-turn
pairs, plus finite geometry, rigs, ten approved Start images and a single
shared book. Astro checks and preview/production-fixture builds are separate
from browser evidence. No deployment or legacy-site cutover is performed.
