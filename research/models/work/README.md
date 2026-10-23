# Work spread asset study — 23 October 2026

Target: `research/design/chapters/round-2/03-work.png` and Matthew's supplied Work-page screenshot. This is an editable Blender asset study using the same book/studio workflow as Services. The website preview and existing Services asset are unchanged.

Run from repository root:

`blender --background --python tool/assets/build_work.py`

`paper_scene.py` supplies shared paper-book and studio helpers. Import it only inside a fresh Blender background process: it initializes a new scene. The earlier Services generator remains independently reproducible.

Outputs: `work.blend` (editable source), `work-render.png` (offline Cycles render), `work-geometry.glb` (draft browser asset), `validation.json` (structural checks), `provenance.json` (source imagery).

- PuttPulse: a basket with blue band, hanging chains and open cage, a raised mulch bed, grass/foliage, a loose disc and twelve small orange marker clusters. There is no tee pad.
- Shiny-filteRs: the repository's original application capture inset in a separate phone shell; folded, colored paper geometry rises behind it. Screen UVs omit external phone/browser chrome. No application results have been invented.
- Hinuhinu: colored-region silhouettes extracted from the original map artwork, raised as stylized paper contour stacks, with the original map applied to their top surfaces and a standing altitude-chart print. The contour heights are not DEM-derived elevations or new scientific data.
- Six physical chapter tags, with Work active; three project nameplates and destination metadata.

The original image files are preserved. Images are packed into the Blender file/GLB; system font binaries are not packed or redistributed. Editable text references local macOS Georgia/Arial, and export converts it to geometry.

An offline render and a valid GLB do not establish exact reference fidelity or WebGL parity. Procedural paper micro-bump/studio lighting are not baked for browser use. Fine paper finish, binding, composition, final materials, interaction mechanisms and mobile performance remain separate acceptance work. No app integration or production deployment is claimed.
