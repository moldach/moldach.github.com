"""Versioned Work miniature; original .blend and published assets remain untouched.
blender --background --python tool/assets/build_work_finish.py -- enhanced
"""

import sys
import json
import math
import hashlib
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
TIER = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "enhanced"
OUT = ROOT / "research/models/work/finish-v1" / TIER
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "research/models/work/work.blend"))
scene = bpy.context.scene
bpy.context.preferences.filepaths.save_version = 0
rng = np.random.default_rng(181)


sys.path.insert(0, str(Path(__file__).resolve().parent))
from miniature_materials import apply_material_library  # noqa: E402

apply_material_library(OUT, TIER)
print("WORK_FINISH: surface library ready", flush=True)

metal = bpy.data.materials["Basket chains"]
paint = bpy.data.materials["Basket cobalt"]
# Replace wire-like chains with individually interlocking miniature links.
for o in list(scene.objects):
    if o.name.startswith("Hanging basket chain"):
        bpy.data.objects.remove(o, do_unlink=True)


def ring_mesh(name, major, minor, segments, tube):
    vertices = []
    faces = []
    for i in range(segments):
        a = i * math.tau / segments
        for j in range(tube):
            b = j * math.tau / tube
            vertices.append(
                (
                    (major + minor * math.cos(b)) * math.cos(a),
                    (major + minor * math.cos(b)) * math.sin(a),
                    minor * math.sin(b),
                )
            )
    for i in range(segments):
        for j in range(tube):
            faces.append(
                (
                    i * tube + j,
                    ((i + 1) % segments) * tube + j,
                    ((i + 1) % segments) * tube + (j + 1) % tube,
                    i * tube + (j + 1) % tube,
                )
            )
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mesh.materials.append(metal)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return mesh


link_mesh = ring_mesh(
    "Individual oval link",
    0.024,
    0.0055,
    12 if TIER == "enhanced" else 8,
    6 if TIER == "enhanced" else 4,
)
attachment_mesh = ring_mesh("Attachment ring", 0.025, 0.008, 16, 6)
for strand in range(16):
    a = strand * math.tau / 16
    for j in range(18):
        t = j / 17
        r = 0.29 * (1 - t) + 0.09 * t + 0.055 * math.sin(t * math.pi)
        o = bpy.data.objects.new(
            f"Basket individual link {strand:02}-{j:02}", link_mesh
        )
        scene.collection.objects.link(o)
        o.location = (-3.2 + r * math.cos(a), 0.1 + r * math.sin(a), 2.30 - t * 0.75)
        o.scale = (1, 1.32, 1)
        o.rotation_euler = (math.pi / 2, 0, a + (j % 2) * math.pi / 2)
    o = bpy.data.objects.new("Basket attachment ring", attachment_mesh)
    scene.collection.objects.link(o)
    o.location = (-3.2 + 0.29 * math.cos(a), 0.1 + 0.29 * math.sin(a), 2.315)
print("WORK_FINISH: modeled basket", flush=True)

# Replace triangular paper grass with curved miniature blades; shared materials batch later.
for o in list(scene.objects):
    if o.name.startswith(("Short paper grass blade", "Folded course foliage")):
        bpy.data.objects.remove(o, do_unlink=True)
verts, faces, indices = [], [], []
for i in range(1000 if TIER == "enhanced" else 380):
    a = float(rng.uniform(0, math.tau))
    r = float(np.sqrt(rng.random()))
    x = -3.2 + math.cos(a) * r * 1.56
    y = -0.1 + math.sin(a) * r * 1.33
    if ((x + 3.2) / 1.04) ** 2 + ((y - 0.1) / 0.91) ** 2 < 1:
        continue
    h = float(rng.uniform(0.055, 0.19))
    w = float(rng.uniform(0.008, 0.019))
    angle = float(rng.uniform(0, math.tau))
    n = len(verts)
    for k in range(4):
        t = k / 3
        bend = t * t * h * 0.6
        for side in [-1, 1]:
            verts.append(
                (
                    x + math.cos(angle) * bend + side * w * (1 - t) * math.sin(angle),
                    y + math.sin(angle) * bend - side * w * (1 - t) * math.cos(angle),
                    0.77 + t * h,
                )
            )
    for k in range(3):
        faces.append((n + k * 2, n + k * 2 + 1, n + k * 2 + 3, n + k * 2 + 2))
        indices.append(i % 4)
mesh = bpy.data.meshes.new("Curved grass blades")
mesh.from_pydata(verts, [], faces)
mesh.update()
o = bpy.data.objects.new("Miniature living grass", mesh)
scene.collection.objects.link(o)
for i in range(4):
    mesh.materials.append(bpy.data.materials[f"Grass paper {i}"])
for poly, idx in zip(mesh.polygons, indices):
    poly.material_index = idx

# Full original application image, fitted without stretching or cropping.
screen = bpy.data.objects["Original application screen"]
image = bpy.data.images.get("featured.jpg")
if image is None:
    image = next(
        n.image
        for n in screen.active_material.node_tree.nodes
        if n.type == "TEX_IMAGE"
        and n.image
        and n.image.source == "FILE"
        and n.image.filepath.endswith(".jpg")
    )
ratio = image.size[0] / image.size[1]
w = min(1.42, 2.92 * ratio)
h = w / ratio
for v, co in zip(
    screen.data.vertices,
    [
        (-0.15 - w / 2, 0.246, 2.05 - h / 2),
        (-0.15 + w / 2, 0.246, 2.05 - h / 2),
        (-0.15 + w / 2, 0.246, 2.05 + h / 2),
        (-0.15 - w / 2, 0.246, 2.05 + h / 2),
    ],
):
    v.co = co
for poly in screen.data.polygons:
    for loop in poly.loop_indices:
        screen.data.uv_layers.active.data[loop].uv = [(0, 0), (1, 0), (1, 1), (0, 1)][
            screen.data.loops[loop].vertex_index
        ]
screen["href"] = "/work/#shiny-filters"
# Glass is a separate thin physical lens with clearcoat, not a reflection painted into the image.
glass = bpy.data.materials.new("Optical glass")
glass.use_nodes = True
glass["materialId"] = "glass"
p = glass.node_tree.nodes["Principled BSDF"]
p.inputs["Base Color"].default_value = (0.98, 0.99, 1, 1)
p.inputs["Roughness"].default_value = 0.1
p.inputs["Transmission Weight"].default_value = 1
p.inputs["IOR"].default_value = 1.46
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.15, 0.232, 2.05))
o = bpy.context.object
o.name = "Phone glass lens"
o.dimensions = (1.47, 0.008, 2.99)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
o.data.materials.append(glass)
bevel = o.modifiers.new("Polished lens perimeter", "BEVEL")
bevel.width = 0.045
bevel.segments = 5
# Small housing seams and metal controls make the shell a physical object.
for z in [2.15, 2.43]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.696, 0.36, z))
    o = bpy.context.object
    o.name = "Phone tactile side control"
    o.dimensions = (0.025, 0.085, 0.18)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(metal)
    m = o.modifiers.new("Rounded control", "BEVEL")
    m.width = 0.01
    m.segments = 3

# Hide invisible interior sheets, retain the visible stack and a continuous edge shell.
for o in list(scene.objects):
    if o.name.startswith("Paper leaf ") and o.name != "Paper leaf 29":
        bpy.data.objects.remove(o, do_unlink=True)
# Fore-edge wall: fine printed striations are surface detail rather than detached wires.
for y in [-2.824, 2.824]:
    v = []
    for i in range(121):
        x = -5 + i / 12
        top = (
            0.20
            + 0.30 * math.sin(math.pi * min(1, abs(x) / 5))
            + 0.13 * min(1, abs(x) / 5)
            + max(0, y - 1.3) ** 1.3 * 0.65
        )
        v.extend([(x, y, top - 0.445), (x, y, top - 0.008)])
    mesh = bpy.data.meshes.new("Fore edge backing")
    mesh.from_pydata(
        v, [], [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(120)]
    )
    mesh.update()
    o = bpy.data.objects.new("Binding fore-edge backing", mesh)
    scene.collection.objects.link(o)
    mesh.materials.append(bpy.data.materials["Ivory paper with fibers"])
# Narrow cloth hinge reinforces the centre seam.
for x in [-0.07, 0.07]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 0.205))
    o = bpy.context.object
    o.name = "Binding cloth hinge"
    o.dimensions = (0.045, 5.55, 0.012)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(bpy.data.materials["Cobalt cloth"])

# Convert the entire selection once; avoid rebuilding the dependency graph per part.
bpy.ops.object.select_all(action="DESELECT")
objects = [
    o
    for o in scene.objects
    if o.type in {"MESH", "CURVE", "FONT"} and o.name != "Studio floor"
]
for o in objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = objects[0]
bpy.ops.object.convert(target="MESH")
print("WORK_FINISH: geometry converted", flush=True)
seen_meshes = set()
for o in objects:
    mesh = o.data
    if mesh.name in seen_meshes:
        continue
    seen_meshes.add(mesh.name)
    if not mesh.uv_layers:
        mesh.uv_layers.new(name="UVMap")
    uv = mesh.uv_layers.get("SurfaceUV") or mesh.uv_layers.new(name="SurfaceUV")
    vertices = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get("co", vertices)
    matrix = np.array(o.matrix_world)
    points = vertices.reshape(-1, 3) @ matrix[:3, :3].T + matrix[:3, 3]
    normals = np.empty(len(mesh.polygons) * 3, dtype=np.float32)
    mesh.polygons.foreach_get("normal", normals)
    counts = np.empty(len(mesh.polygons), dtype=np.int32)
    mesh.polygons.foreach_get("loop_total", counts)
    axes = np.repeat(np.abs(normals.reshape(-1, 3)).argmax(axis=1), counts)
    loops = np.empty(len(mesh.loops), dtype=np.int32)
    mesh.loops.foreach_get("vertex_index", loops)
    pairs = np.array([[1, 2], [0, 2], [0, 1]])[axes]
    coordinates = np.take_along_axis(points[loops], pairs, axis=1) * 2
    uv.data.foreach_set("uv", coordinates.astype(np.float32).ravel())
    mesh.uv_layers.active_index = 0
print("WORK_FINISH: UV surfaces assigned", flush=True)


def group(name, role=None):
    o = bpy.data.objects.new(name, None)
    scene.collection.objects.link(o)
    if role:
        o["role"] = role
    return o


def parent_keep(o, parent):
    matrix = o.matrix_world.copy()
    o.parent = parent
    o.matrix_world = matrix


shared = group("Finished shared book", "shared-book")
content = group("Work miniature", "chapter-content")
content["chapter"] = "work"
rigs = {}
for i, (name, pivot, angle) in enumerate(
    [
        ("puttpulse-basket", (-3.2, 0.1, 0.89), math.pi / 2),
        ("shiny-device", (-0.15, 0.40, 0.55), math.pi / 2),
        ("hinuhinu-chart", (3.8, 1.70, 1.25), math.pi / 2),
    ]
):
    o = group(name)
    o.location = pivot
    o["rigId"] = name
    o["order"] = i
    o["rest"] = {"rotation": [0.0, 0.0, 0.0, 1.0], "scale": [1.0, 1.0, 1.0]}
    o["folded"] = {
        "rotation": [math.sin(angle / 2), 0.0, 0.0, math.cos(angle / 2)],
        "scale": [1.0, 1.0, 1.0],
    }
    o.parent = content
    o.location = pivot
    bpy.context.view_layer.update()
    rigs[name] = o
names = ["Start", "Services", "Work", "Writing", "About", "Contact"]
for o in list(scene.objects):
    if o.type != "MESH" or o.name == "Studio floor":
        continue
    name = o.name
    tab = next(
        (
            i
            for i, n in enumerate(names)
            if name in ["Chapter tab " + n, "Printed " + n]
        ),
        None,
    )
    if tab is not None:
        o["chapterIndex"] = tab
        o["tabSurface"] = name.startswith("Chapter tab")
        parent_keep(o, shared)
    elif name.startswith(
        (
            "Cobalt lower cover",
            "Paper leaf ",
            "Leaf fore-edge",
            "Reading spread",
            "Binding",
        )
    ):
        parent_keep(o, shared)
    elif name.startswith(("Basket ", "Open basket")):
        parent_keep(o, rigs["puttpulse-basket"])
    elif name.startswith(
        (
            "Shiny-filteRs phone",
            "Phone ",
            "Original application",
            "Folded filter fan",
            "Folded device support",
        )
    ):
        parent_keep(o, rigs["shiny-device"])
    elif name.startswith(("Standing Hinuhinu chart", "Altitude chart")):
        parent_keep(o, rigs["hinuhinu-chart"])
    else:
        parent_keep(o, content)
# Semantic href nodes stay separate; repeated scenery is batched by material and parent.
batches = {}
for o in list(scene.objects):
    if o.type == "MESH" and o.parent and "chapterIndex" not in o and "href" not in o:
        key = (o.parent.name, tuple(m.name for m in o.data.materials))
        batches.setdefault(key, []).append(o)
for key, objects in batches.items():
    if len(objects) < 2:
        continue
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    bpy.context.object.name = key[0] + " / " + key[1][0]

from refine_work_hinges import refine  # noqa: E402

refine()
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.render.threads_mode = "FIXED"
scene.render.threads = 4
scene.render.resolution_x = 1800
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.view_settings.exposure = 0
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "work-finish.blend"))
# Render only enhanced tier; compact uses the same composed poster.
if TIER == "enhanced":
    scene.render.filepath = str(OUT / "spread.png")
    bpy.ops.render.render(write_still=True)
    original_matrix = scene.camera.matrix_world.copy()
    original_lens = scene.camera.data.lens
    for name, position, target in [
        ("basket", (-5, -4, 3.6), (-3.2, 0.1, 1.45)),
        ("device", (1, -4, 3.5), (-0.15, 0.3, 2)),
        ("map", (6, -3, 5), (3.3, 0.5, 1)),
    ]:
        scene.camera.location = position
        scene.camera.rotation_euler = (
            (Vector(target) - scene.camera.location).to_track_quat("-Z", "Y").to_euler()
        )
        scene.camera.data.lens = 65
        scene.render.resolution_x = 1000
        scene.render.resolution_y = 1000
        scene.render.filepath = str(OUT / (name + ".png"))
        bpy.ops.render.render(write_still=True)
    scene.camera.matrix_world = original_matrix
    scene.camera.data.lens = original_lens
for slug, root in [("shared", shared), ("work", content)]:
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for o in root.children_recursive:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / (slug + ".glb")),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=True,
        export_animations=False,
    )
source_paths = [
    "research/models/work/work.blend",
    "project/shiny-filters/featured.jpg",
    "project/hinuhinu/featured.png",
]
(OUT / "provenance.json").write_text(
    json.dumps(
        {
            "tier": TIER,
            "sources": [
                {
                    "path": p,
                    "sha256": hashlib.sha256((ROOT / p).read_bytes()).hexdigest(),
                }
                for p in source_paths
            ],
            "surfaceMaps": "Original deterministic surface-only normal and roughness maps; no baked illumination.",
            "mapHeights": "Illustrative paper contours; original map preserved, not DEM elevations.",
            "rigs": list(rigs),
            "sourceAspectRatio": ratio,
        },
        indent=2,
    )
    + "\n"
)
print("WORK_FINISH_COMPLETE", TIER)
