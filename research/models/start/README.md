# Start spread asset study — 23 October 2026

Target: `research/design/chapters/round-2/01-start.png`. This is an editable Blender source, offline Cycles render and draft geometry export, separate from the existing website prototype.

Reproduce from repository root: `blender --background --python tool/assets/build_start.py`. The shared `paper_scene.py` helper initializes a fresh background Blender scene. Outputs are `start.blend`, `start-render.png` and `start-geometry.glb`.

The opening contains a coral photo tray with five mounted proofs, an accordion sequence crossing the gutter, a cream terminal with recessed cobalt screen, individual keys, vents and control knob, three curved film loops with open sprocket perforations, and a separate resolved output photograph. Six physical fore-edge chapter tags remain, with Start active. Printed headings follow the curved leaf.

The original skiing style-transfer artwork is packed into the editable scene and reused inside individual film/photo meshes. The full source is preserved without raster edits. Its portrait aspect is retained in the freestanding output photograph; curved film cells and proof mounts have illustrative framing and may distort the original aspect. No new video, business outcome or client project is asserted. The arrow on the screen is separate geometry to avoid missing font glyphs.

`/writing/faststyletransfer/` is retained as destination metadata, matching the existing article. This does not implement browser links. Font files remain external rather than redistributed; the GLB converts text to mesh geometry.

Remaining work includes owner visual review, refinement against the reference, browser material baking, scene optimization, raycast/HTML link wiring, page-turn rigging and performance verification. The draft GLB does not reproduce Cycles lighting or procedural micro-bump. Neither this study nor the six-study inventory establishes an accepted WebGL experience. The live preview and required interactive portrait are unchanged.
