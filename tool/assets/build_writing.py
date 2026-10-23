"""Editable Writing chapter study: real source illustrations and paper machinery.
Run: blender --background --python tool/assets/build_writing.py
Brain relief is an illustration, not reconstructed or validated brain geometry.
"""

import sys
import math
from collections import deque
from pathlib import Path

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import paper_scene as B  # noqa: E402

OUT = B.ROOT / "research/models/writing"
B.make_book(3)
UMAP = "/writing/supervised-umap/"
FITBIT = "/writing/fitbit-gamification/"
BRAIN = "https://towardsdatascience.com/how-to-highlight-3d-brain-regions-2e6c15a35574"


def printed(body, x, y, size, font=B.font, material=B.ink):
    o = B.text("Printed " + body, body, (x, y, 1.0), size, font, material)
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.object
    for vertex in o.data.vertices:
        vertex.co.z = (
            B.height(vertex.co.x + x)
            + B.rear_fold(vertex.co.y + y)
            + 0.03
            - o.location.z
        )
    o.select_set(False)
    return o


printed("Notes from", -4.4, 2.25, 0.55, B.bold)
printed("the work.", -4.4, 1.82, 0.55, B.bold)
for label, y, href in [
    ("Supervised UMAP", 1.35, UMAP),
    ("The Gamification of Fitbit", 1.04, FITBIT),
    ("Highlighting 3D Brain Regions", 0.73, BRAIN),
]:
    printed(label, -4.34, y, 0.19)["href"] = href
printed("Experiments, explanations, lessons.", -4.34, 0.49, 0.14, B.font, B.ink)


# Full original source images on their own folios; aspect ratios are preserved.
def picture(name, path, cx, y, cz, width, href):
    image = bpy.data.images.load(str(B.ROOT / path))
    image.pack()
    w, h = image.size
    height = width * h / w
    m = bpy.data.materials.new(name + " original image")
    m.use_nodes = True
    tex = m.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = image
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.88
    o = B.mesh(
        name,
        [
            (cx - width / 2, y, cz - height / 2),
            (cx + width / 2, y, cz - height / 2),
            (cx + width / 2, y, cz + height / 2),
            (cx - width / 2, y, cz + height / 2),
        ],
        [(0, 1, 2, 3)],
        m,
    )
    uv = o.data.uv_layers.new()
    coordinates = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for polygon in o.data.polygons:
        for loop in polygon.loop_indices:
            uv.data[loop].uv = coordinates[o.data.loops[loop].vertex_index]
    o["href"] = href
    o["sourceImage"] = path
    return o, image, m


def folio(name, x, y, z, width, height, href):
    o = B.box(name, (x, y, z), (width, 0.055, height), B.white, 0.008)
    o["href"] = href
    # Side folds and individual paper support gussets establish real depth.
    for side in [-1, 1]:
        xx = x + side * (width / 2 - 0.05)
        g = B.mesh(
            name + " folded support",
            [
                (xx, y - 0.06, z - height / 2),
                (xx, y + 0.55, z - height / 2),
                (xx, y + 0.03, z + height * 0.23),
            ],
            [(0, 1, 2)],
            B.paper,
        )
        g.modifiers.new("Fold thickness", "SOLIDIFY").thickness = 0.028
    return o


folio("UMAP proof sheet", -0.28, 1.12, 2.14, 2.22, 2.80, UMAP)
B.text(
    "UMAP folio heading",
    "Supervised UMAP",
    (-1.28, 1.083, 3.25),
    0.20,
    B.font,
    rotation=(math.pi / 2, 0, 0),
)
picture(
    "Original supervised embedding",
    "research/design/source-assets/supervised-umap/embedded-03.png",
    -0.28,
    1.08,
    2.30,
    2.02,
    UMAP,
)
folio("Fitbit article folio", 2.00, 0.98, 1.99, 1.73, 2.60, FITBIT)
B.text(
    "Fitbit folio heading",
    "The Gamification\nof Fitbit",
    (1.22, 0.94, 3.10),
    0.17,
    B.font,
    rotation=(math.pi / 2, 0, 0),
)
picture(
    "Original Fitbit game scene",
    "project/fitbit-project/featured.png",
    2.0,
    0.938,
    1.96,
    1.53,
    FITBIT,
)
folio("Brain article folio", 3.96, 0.73, 1.78, 1.74, 2.35, BRAIN)
B.text(
    "Brain folio heading",
    "Highlighting\n3D Brain Regions",
    (3.17, 0.69, 2.77),
    0.16,
    B.font,
    rotation=(math.pi / 2, 0, 0),
)

# Source-based shallow brain surface: the exact original image supplies silhouette
# and red patch. Surface depth is illustrative; no labels or unseen anatomy added.
brain = bpy.data.images.load(str(B.ROOT / "project/3d-brain/featured.png"))
brain.pack()
bw, bh = brain.size
pixels = np.asarray(brain.pixels[:]).reshape(bh, bw, 4)[::-1, :, :3]
material = bpy.data.materials.new("Original brain-region illustration")
material.use_nodes = True
tex = material.node_tree.nodes.new("ShaderNodeTexImage")
tex.image = brain
bsdf = material.node_tree.nodes.get("Principled BSDF")
material.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.90
n = 100
verts = []
valid = []
uvs = []
for row in range(n + 1):
    v = row / n
    for col in range(n + 1):
        u = col / n
        rgb = pixels[min(bh - 1, int(v * (bh - 1))), min(bw - 1, int(u * (bw - 1)))]
        inside = float(rgb.min()) < 0.955
        valid.append(inside)
        uvs.append((u, 1 - v))
        lum = float(rgb.mean())
        depth = (
            0.06
            + 0.04 * (1 - min(1, lum))
            + 0.055 * max(0, 1 - ((u - 0.5) / 0.35) ** 2 - ((v - 0.53) / 0.35) ** 2)
        )
        verts.append((3.96 + (u - 0.5) * 2.45, 0.675 - depth, 1.63 + (0.5 - v) * 2.45))
# Close single-sample gaps, then fill only enclosed holes in the source mask.
mask = np.asarray(valid, dtype=bool).reshape(n + 1, n + 1)
expanded = mask.copy()
for dy in [-1, 0, 1]:
    for dx in [-1, 0, 1]:
        shifted = np.roll(np.roll(mask, dy, axis=0), dx, axis=1)
        expanded |= shifted
outside = set()
queue = deque()
for i in range(n + 1):
    for x, y in [(i, 0), (i, n), (0, i), (n, i)]:
        if not expanded[y, x] and (x, y) not in outside:
            outside.add((x, y))
            queue.append((x, y))
while queue:
    x, y = queue.popleft()
    for xx, yy in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
        if (
            0 <= xx <= n
            and 0 <= yy <= n
            and not expanded[yy, xx]
            and (xx, yy) not in outside
        ):
            outside.add((xx, yy))
            queue.append((xx, yy))
valid = [(col, row) not in outside for row in range(n + 1) for col in range(n + 1)]
faces = []
for row in range(n):
    for col in range(n):
        a = row * (n + 1) + col
        if all(valid[j] for j in [a, a + 1, a + n + 2, a + n + 1]):
            faces.append((a, a + 1, a + n + 2, a + n + 1))
relief = B.mesh("Source brain illustration relief", verts, faces, material)
uv = relief.data.uv_layers.new()
for polygon in relief.data.polygons:
    polygon.use_smooth = True
    for loop in polygon.loop_indices:
        uv.data[loop].uv = uvs[relief.data.loops[loop].vertex_index]
relief.modifiers.new("Paper relief backing", "SOLIDIFY").thickness = 0.035
relief["href"] = BRAIN
relief["illustrativeDepthOnly"] = True
relief["anatomyValidated"] = False
# Visible folded mounting arms at the base, rather than an ungrounded floating print.
for x in [3.33, 4.59]:
    B.mesh(
        "Brain relief folded mounting",
        [(x, 0.30, 0.69), (x, 0.80, 0.69), (x, 0.65, 1.22)],
        [(0, 1, 2)],
        B.paper,
    )


# Proofing press with two actual rollers, separate axle ends and folded supports.
def cylinder(name, loc, radius, length, mat, axis="X"):
    rotation = (0, math.pi / 2, 0) if axis == "X" else (0, 0, 0)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=64, radius=radius, depth=length, location=loc, rotation=rotation
    )
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    bevel = o.modifiers.new("Roller bevel", "BEVEL")
    bevel.width = 0.015
    bevel.segments = 3
    return o


steel = B.mat("Ink press dark fittings", (0.075, 0.088, 0.092), False)
cylinder("Ivory proofing roller", (-0.30, -0.32, 1.22), 0.38, 2.24, B.white)
cylinder("Main roller axle", (-0.30, -0.32, 1.22), 0.09, 2.89, steel)
for x in [-1.56, 0.96]:
    cylinder("Cobalt roller collar", (x, -0.32, 1.22), 0.32, 0.16, B.blue)
    cylinder(
        "Ivory bearing ring",
        (x + (-0.10 if x < 0 else 0.10), -0.32, 1.22),
        0.24,
        0.12,
        B.paper,
    )
    B.mesh(
        "Press triangular folded support",
        [(x, -0.91, 0.53), (x, 0.31, 0.53), (x, -0.12, 1.60), (x, -0.44, 1.60)],
        [(0, 1, 2, 3)],
        B.white,
    ).modifiers.new("Support thickness", "SOLIDIFY").thickness = 0.13
cylinder("Coral ink roller", (-0.30, -1.06, 0.83), 0.17, 1.74, B.coral)
cylinder("Ink roller axle", (-0.30, -1.06, 0.83), 0.045, 2.03, steel)
B.box("Ink tray base", (-0.3, -1.43, 0.56), (2.14, 1.04, 0.14), B.white, 0.008)
B.box("Coral ink bed", (-0.3, -1.43, 0.64), (1.96, 0.88, 0.018), B.coral, 0.003)
for x in [-1.36, 0.76]:
    B.box("Ink tray wall", (x, -1.43, 0.70), (0.07, 1.04, 0.22), B.white, 0.005)
B.box("Ink tray fore-edge", (-0.3, -1.92, 0.70), (2.14, 0.07, 0.22), B.white, 0.005)
# A bent proof sheet bridges the standing folio and roller.
verts = []
faces = []
for j in range(36):
    t = j / 35
    y = -0.85 + t * 1.82
    z = 0.63 + 0.15 * math.sin(t * math.pi) + 1.12 * t * t
    for x in [-1.20, 0.60]:
        verts.append((x, y, z))
for j in range(35):
    a = j * 2
    faces.append((a, a + 1, a + 3, a + 2))
B.mesh("Continuous folded proof sheet", verts, faces, B.white)

# Left stationery: a real file tray, cards, paper stacks and plain printer blocks.
B.box("Stationery tray base", (-3.33, -0.70, 0.64), (1.69, 0.96, 0.12), B.white, 0.008)
for x in [-4.14, -2.52]:
    B.box("Stationery tray side", (x, -0.70, 0.84), (0.07, 0.96, 0.45), B.paper, 0.006)
B.box("Stationery tray front", (-3.33, -1.14, 0.83), (1.69, 0.06, 0.40), B.white, 0.006)
for i in range(7):
    B.box(
        "Printer card",
        (-3.89 + i * 0.18, -0.67, 1.05),
        (0.12, 0.61, 0.72),
        B.blue if i in [2, 3] else B.coral if i == 0 else B.white,
        0.005,
    )
for x, y in [(-3.75, -1.70), (-2.26, -0.88), (2.17, -1.32)]:
    for layer in range(8):
        B.box(
            "Layered proof paper",
            (x, y, 0.58 + layer * 0.025),
            (0.96, 0.62, 0.022),
            B.white,
            0.002,
        )
for x, y in [(-2.38, -1.42), (-1.86, -0.57)]:
    B.box("Plain cobalt printer block", (x, y, 0.86), (0.50, 0.49, 0.51), B.blue, 0.012)

# A dimensional fitness strap on a separate small stack of paper.
for layer in range(6):
    B.box(
        "Fitbit paper pedestal",
        (2.0, -0.50, 0.68 + layer * 0.026),
        (1.45, 0.91, 0.025),
        B.white,
        0.003,
    )
verts = []
faces = []
segments = 64
for z in [0.87, 1.07]:
    for rx, ry in [(0.58, 0.34), (0.45, 0.23)]:
        for i in range(segments):
            a = i * math.tau / segments
            verts.append((2 + rx * math.cos(a), -0.5 + ry * math.sin(a), z))
for i in range(segments):
    j = (i + 1) % segments
    faces.extend(
        [
            (i, j, segments + j, segments + i),
            (2 * segments + i, 3 * segments + i, 3 * segments + j, 2 * segments + j),
            (i, 2 * segments + i, 2 * segments + j, j),
            (segments + i, segments + j, 3 * segments + j, 3 * segments + i),
        ]
    )
strap = B.mesh("Fitness wristband", verts, faces, B.blue)
strap["href"] = FITBIT
B.box("Fitness band screen", (2.0, -0.842, 0.99), (0.65, 0.08, 0.20), B.ink, 0.025)
for i in range(7):
    a = 0.20 + i * 0.39
    cylinder(
        "Strap printed perforation",
        (2 + 0.52 * math.cos(a), -0.5 + 0.29 * math.sin(a), 1.076),
        0.018,
        0.008,
        B.ink,
        "Z",
    )

B.studio_and_export(OUT, "writing")
