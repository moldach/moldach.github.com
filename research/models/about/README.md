# About spread asset study — 23 October 2026

Target: `research/design/chapters/round-2/05-about.png` and Matthew's supplied About screenshot. This follows the Services/Work asset workflow: editable Blender source, an offline Cycles render and a draft GLB. It does not change the website preview.

Run from repository root:

`blender --background --python tool/assets/build_about.py`

The chapter builder uses `paper_scene.py` in a fresh background Blender process. Outputs are `about.blend`, `about-render.png`, `about-geometry.glb`, `provenance.json` and `validation.json`.

The spread contains the actual supplied headshot in a cobalt frame; a folded CV panel; a small “less serious” card; a houseplant and stacked books; a compass with a faceted directional star; an open ruled strategy notebook; and a gridded tabletop with blue/coral blocks, pyramids and pawns. Two independent paper hands have modeled palms, articulated finger segments, cuffs and sleeves. About is the active physical chapter tag.

The portrait uses the original 200×200 image with a full-square UV mapping. No face changes, upscaling or invented portrait are used; that resolution limits sharpness. The photo is packed into the editable file and draft GLB. System font files remain external in the Blender source and become geometry on export.

The CV's short rules are decorative, not fabricated qualifications or employment entries. The panel carries `/experience/` destination metadata. The portrait carries `/about/` and a future portrait-dialog identifier; **this offline asset does not implement the required face interaction**. Existing website portrait code remains unchanged.

Draft GLB export retains geometry, basic colors and the photo. Procedural paper micro-bump and studio lighting are not baked for browser parity. A successful render/export and structural checks do not establish exact reference fidelity, WebGL integration, animation, physical-device performance or owner approval. Binding, fine paper finish and final visual acceptance remain open.
