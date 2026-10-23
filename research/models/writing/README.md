# Writing spread asset study — 23 October 2026

Target: `research/design/chapters/round-2/04-writing-v2.png`, including Matthew's requested Fitbit and brain-region replacements. This is an editable Blender study, offline Cycles render and draft GLB; the site preview remains unchanged.

Run: `blender --background --python tool/assets/build_writing.py` from repository root. The builder uses shared `paper_scene.py` helpers in a fresh background Blender process.

Outputs: `writing.blend`, `writing-render.png`, `writing-geometry.glb`, `provenance.json` and `validation.json`. System font binaries remain external; exported text is geometry. Original project images are packed into the editable file and GLB.

The spread contains a two-roller paper proofing press, coral ink bed, folded proof sheet, stationery tray, individual paper stacks and plain cobalt printer blocks. Article exhibits are distinct:

- Supervised UMAP: the original full landscape plot on a standing proof folio. Its aspect ratio, axes and source points are preserved; it is not redrawn as an invented scatterplot. Destination: `/writing/supervised-umap/`.
- Fitbit gamification: the original full pixel-art image on its own folio, plus a separately modeled blue fitness wristband. Destination: `/writing/fitbit-gamification/`. This is not a functional game or tracking device.
- Brain regions: a shallow source-image-textured surface preserving the original silhouette and small red region. Surface depth is illustrative, not reconstructed/validated brain anatomy or unseen surfaces. The destination is the original publisher article at `https://towardsdatascience.com/how-to-highlight-3d-brain-regions-2e6c15a35574`.

Each exhibit and printed index entry retains article destination metadata. These are future browser hooks, not currently clickable browser geometry. Six physical chapter tabs remain, with Writing active. Drake and .Rprofile are not featured in this spread; they remain in the archive.

The original source images are unchanged; provenance records their SHA-256 hashes. Source brain geometry is a shallow illustration relief, not a fully modeled anatomical asset. No new scientific labels, scores, measurements or paper claims are invented.

Fine paper finish, binding/composition, final visual acceptance, baked browser materials, mesh/HTML navigation and browser/device performance remain separate acceptance work. Offline render and GLB structural checks do not establish WebGL parity or completed site integration. Procedural paper micro-bump and studio lighting are not baked into this draft export.
