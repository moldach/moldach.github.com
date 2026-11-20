# Services asset workbench

Target: `research/design/chapters/round-2/02-services.png`, the first book in Matthew's supplied three-card screenshot. The screenshot's other two books are Work and About, not alternate views of Start.

`tool/assets/build_services.py` authors the geometry and studio scene. Run from the repository root with `blender --background --python tool/assets/build_services.py`. Blender 5.2.3 is installed locally. The script currently references macOS Georgia/Arial fonts; font files are not embedded or redistributed. Text becomes geometry in the draft GLB.

Outputs:
- `services.blend`: editable source, before export conversion.
- `services-render.png`: offline Cycles look-development render.
- `services-geometry.glb`: draft geometry/material-color export. Procedural paper micro-bump and the studio lighting are **not baked** for browser parity.

No full concept image is projected onto this model. A successful render/export does not establish a visual match, interactive page turns, performance or WebGL fidelity. The app's current preview remains unchanged while this asset is assessed.

Required comparison before integration:
1. Match the reference's near-frontal camera, crop, fore-edge and curved binding.
2. Match the cobalt folio's folds and large ivory plinths; preserve distinct magnifier, seven-node workflow and manual/people silhouettes.
3. Match the scale and placement of title, platform labels and the six physical chapter tabs.
4. Match paper edge thickness, fiber scale and restrained ivory/cobalt/coral colors.
5. Match soft contact shadows and the depth of the pop-up structures, rather than treating object counts as fidelity evidence.
6. Bake/export materials, inspect the GLB in Three.js, and establish browser parity before making it the default.

Work and About require their own dedicated assets. They are not completed by this Services study. Original reference images and legacy published root remain unchanged.

Current comparison: the broad Services composition is authored, but the fine crumpled-paper finish, exact lens/card arrangement, book binding and camera match are still unfinished. The offline image must not be described as an exact reproduction. No website code was changed in this pass.
