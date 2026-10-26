"""Export an existing editable finish source without repeating the render."""

import json
import hashlib
from pathlib import Path
import sys
from mathutils import Vector
import bpy

root = Path(__file__).resolve().parents[2]
out = root / "research/models/work/finish-v1/enhanced"
bpy.ops.wm.open_mainfile(filepath=str(out / "work-finish.blend"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from refine_work_hinges import refine  # noqa: E402

refine()
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(out / "work-finish.blend"))
for slug, role in [("shared", "shared-book"), ("work", "chapter-content")]:
    node = next(o for o in bpy.context.scene.objects if o.get("role") == role)
    bpy.ops.object.select_all(action="DESELECT")
    node.select_set(True)
    for child in node.children_recursive:
        child.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(out / (slug + ".glb")),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=True,
        export_animations=False,
    )
sources = [
    "research/models/work/work.blend",
    "project/shiny-filters/featured.jpg",
    "project/hinuhinu/featured.png",
]
(out / "provenance.json").write_text(
    json.dumps(
        {
            "sources": [
                {
                    "path": p,
                    "sha256": hashlib.sha256((root / p).read_bytes()).hexdigest(),
                }
                for p in sources
            ],
            "surfaceMaps": "Original deterministic surface-only normal and roughness maps; no baked illumination.",
            "mapHeights": "Illustrative paper contours; original map preserved, not DEM elevations.",
            "rigs": ["puttpulse-basket", "shiny-device", "hinuhinu-chart"],
            "authoring": "build_work_finish.py plus refine_work_hinges.py; export_work_finish.py supports re-export and --render",
        },
        indent=2,
    )
    + "\n"
)
print("WORK_FINISH_EXPORT_COMPLETE", flush=True)

if "--render" in sys.argv:
    scene = bpy.context.scene
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 4
    for name, position, target in [
        ("spread", None, None),
        ("basket", (-5, -4, 3.6), (-3.2, 0.1, 1.45)),
        ("device", (1, -4, 3.5), (-0.15, 0.3, 2)),
        ("map", (6, -3, 5), (3.3, 0.5, 1)),
    ]:
        if position:
            scene.camera.location = position
            scene.camera.rotation_euler = (
                (Vector(target) - scene.camera.location)
                .to_track_quat("-Z", "Y")
                .to_euler()
            )
            scene.camera.data.lens = 65
        scene.render.resolution_x = 1800 if name == "spread" else 1000
        scene.render.resolution_y = 1200 if name == "spread" else 1000
        scene.render.filepath = str(out / (name + ".png"))
        bpy.ops.render.render(write_still=True)
