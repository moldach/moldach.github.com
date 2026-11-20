"""Build the About chapter as an editable paper scene and offline render.
Run: blender --background --python tool/assets/build_about.py
The supplied headshot is preserved. This is not a face-interaction implementation.
"""

import sys
import math
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import paper_scene as B  # noqa: E402

ROOT = B.ROOT
OUT = ROOT / "research/models/about"
B.make_book(4)
green = [
    B.mat("Plant paper " + str(i), c)
    for i, c in enumerate(
        [(0.018, 0.075, 0.045), (0.045, 0.16, 0.085), (0.11, 0.25, 0.14)]
    )
]
handpaper = B.mat("Warm ivory hand paper", (0.85, 0.73, 0.53))
slate = B.mat("Notebook printed lines", (0.39, 0.43, 0.42), False)


# The heading is actually printed on the curved rear paper.
def conform_print(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    for vertex in obj.data.vertices:
        vertex.co.z = (
            B.height(vertex.co.x + obj.location.x)
            + B.rear_fold(vertex.co.y + obj.location.y)
            + 0.03
            - obj.location.z
        )
    obj.select_set(False)
    return obj


conform_print(B.text("About title first", "Matthew,", (-4.40, 2.23, 1.0), 0.53, B.bold))
conform_print(
    B.text("About title second", "in person.", (-4.40, 1.82, 1.0), 0.53, B.bold)
)
conform_print(
    B.text(
        "About subtitle",
        "Curiosity. Craft. Follow-through.",
        (-4.40, 1.65, 1.0),
        0.16,
        B.sans,
    )
)

# A little shelf: distinct stacked books and a folded-paper houseplant.
for i, (x, y, angle, color) in enumerate(
    [
        (-3.38, 0.59, -0.05, B.coral),
        (-3.31, 0.66, 0.08, B.white),
        (-3.31, 0.66, 0.04, B.blue),
    ]
):
    cover = B.box(
        "Stacked book cover " + str(i),
        (x, y, 0.60 + i * 0.21),
        (1.37, 0.86, 0.22),
        color,
        0.015,
    )
    cover.rotation_euler.z = angle
    pages = B.box(
        "Stacked book page block " + str(i),
        (x, y - 0.02, 0.61 + i * 0.21),
        (1.28, 0.78, 0.15),
        B.paper,
        0.007,
    )
    pages.rotation_euler.z = angle
    # Thin top cover preserves the darker cloth edge around the page block.
    top = B.box(
        "Stacked top board " + str(i),
        (x, y, 0.70 + i * 0.21),
        (1.37, 0.86, 0.03),
        color,
        0.006,
    )
    top.rotation_euler.z = angle
B.box("Folded plant pot", (-4.17, -0.03, 0.73), (0.65, 0.63, 0.53), B.white, 0.018)
for i in range(10):
    a = i * math.tau / 10
    length = 0.62 + (i % 3) * 0.14
    base = Vector((-4.17, -0.03, 0.99))
    tip = base + Vector(
        (math.cos(a) * length * 0.42, math.sin(a) * length * 0.42, length)
    )
    mid = (base + tip) / 2 + Vector((math.cos(a) * 0.15, math.sin(a) * 0.15, 0.03))
    side = Vector((-math.sin(a) * 0.13, math.cos(a) * 0.13, 0))
    B.mesh(
        "Folded plant leaf",
        [
            tuple(base),
            tuple(mid + side),
            tuple(tip),
            tuple(mid - side),
            tuple(mid + Vector((0, 0, 0.07))),
        ],
        [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)],
        green[i % 3],
    )

# Open notebook with curved separate leaves and a printed strategy sketch.
nx, ny = 50, 12
for layer in range(7):
    verts = []
    faces = []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x = -3.65 + i * 2.65 / nx
            y = -1.95 + j * 1.61 / ny
            t = abs(x + 2.325) / 1.325
            z = 0.57 + 0.11 * math.sin(t * math.pi) + 0.025 * t + layer * 0.012
            if layer == 0:
                x = -2.325 + (x + 2.325) * 1.05
                y = -1.145 + (y + 1.145) * 1.05
            verts.append((x, y, z))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    B.mesh(
        "Open notebook leaf " + str(layer),
        verts,
        faces,
        B.blue if layer == 0 else B.white,
    )


def notebook_top(x):
    t = abs(x + 2.325) / 1.325
    return 0.57 + 0.11 * math.sin(t * math.pi) + 0.025 * t + 0.072 + 0.004


for row in range(8):
    y = -1.77 + row * 0.16
    B.line(
        "Notebook ruled line",
        [(x, y, notebook_top(x)) for x in [-3.48 + i * 1.02 / 20 for i in range(21)]],
        slate,
        0.003,
    )
B.line(
    "Notebook binding crease",
    [(-2.325, -1.95, 0.65), (-2.325, -0.34, 0.65)],
    B.edge,
    0.012,
)
for x, y, label in [
    (-2.02, -0.68, "Try"),
    (-1.45, -1.05, "Learn"),
    (-2.02, -1.52, "Improve"),
]:
    B.line(
        "Notebook strategy circle",
        [
            (
                x + math.cos(i * math.tau / 40) * 0.18,
                y + math.sin(i * math.tau / 40) * 0.12,
                notebook_top(x + math.cos(i * math.tau / 40) * 0.18) + 0.002,
            )
            for i in range(41)
        ],
        B.blue,
        0.005,
    )
    note = B.text(
        "Notebook note",
        label,
        (x, y - 0.035, notebook_top(x) + 0.004),
        0.07,
        B.sans,
        align="CENTER",
    )
    bpy.ops.object.select_all(action="DESELECT")
    note.select_set(True)
    bpy.context.view_layer.objects.active = note
    bpy.ops.object.convert(target="MESH")
    note = bpy.context.object
    for vertex in note.data.vertices:
        vertex.co.z = (
            notebook_top(vertex.co.x + note.location.x) + 0.004 - note.location.z
        )
    note.select_set(False)
for points in [[(-1.88, -0.78), (-1.67, -0.94)], [(-1.58, -1.16), (-1.87, -1.41)]]:
    B.line(
        "Strategy arrow",
        [(x, y, notebook_top(x) + 0.003) for x, y in points],
        B.blue,
        0.007,
    )


# A cream compass with a faceted directional star and fabric loop.
def cylinder(name, loc, radius, depth, material, vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=loc
    )
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    bevel = o.modifiers.new("Cut rim", "BEVEL")
    bevel.width = 0.018
    bevel.segments = 3
    return o


cylinder("Compass paper case", (-1.47, 0.88, 0.77), 0.49, 0.17, B.paper)
cylinder("Compass cream dial", (-1.47, 0.88, 0.87), 0.405, 0.035, B.white)
for i in range(8):
    a = i * math.pi / 4
    r = 0.32 if i % 2 == 0 else 0.21
    center = (-1.47, 0.88, 0.899)
    tip = (-1.47 + math.sin(a) * r, 0.88 + math.cos(a) * r, 0.90)
    side = (-1.47 + math.sin(a + 0.7) * 0.095, 0.88 + math.cos(a + 0.7) * 0.095, 0.90)
    B.mesh(
        "Compass direction facet",
        [center, tip, side],
        [(0, 1, 2)],
        B.blue if i % 2 == 0 else B.coral,
    )
for label, dx, dy in [("N", 0, 0.33), ("S", 0, -0.36), ("W", -0.33, 0), ("E", 0.33, 0)]:
    B.text(
        "Compass " + label,
        label,
        (-1.47 + dx, 0.88 + dy, 0.91),
        0.09,
        B.sans,
        align="CENTER",
    )
B.line(
    "Compass fabric loop",
    [
        (-1.8, 1.1, 0.70),
        (-2.05, 1.0, 0.62),
        (-2.10, 0.62, 0.61),
        (-1.78, 0.36, 0.62),
        (-1.60, 0.43, 0.63),
    ],
    B.blue,
    0.035,
)

# Small folded card, distinct from the CV.
card = B.box(
    "Less serious folded card", (-1.12, 1.84, 1.24), (0.92, 0.045, 1.10), B.white, 0.008
)
card.rotation_euler.x = math.radians(-6)
B.text(
    "Less serious text",
    "A little\nless serious.",
    (-1.49, 1.79, 1.49),
    0.15,
    B.sans,
    rotation=(math.pi / 2, 0, 0),
)

# Actual reference photograph in a separate thick blue paper frame. No face edit.
portrait_before = set(bpy.context.scene.objects)
px, py, pz = 0.62, 1.58, 2.06
B.box("Portrait backing", (px, py, pz), (2.24, 0.20, 2.30), B.paper, 0.012)
for dx in [-1.16, 1.16]:
    B.box(
        "Portrait blue side",
        (px + dx, py - 0.055, pz),
        (0.22, 0.32, 2.56),
        B.blue,
        0.012,
    )
for dz in [-1.18, 1.18]:
    B.box(
        "Portrait blue top bottom",
        (px, py - 0.055, pz + dz),
        (2.48, 0.32, 0.22),
        B.blue,
        0.012,
    )
for dx in [-1.03, 1.03]:
    B.box(
        "Portrait ivory inner trim",
        (px + dx, py - 0.23, pz),
        (0.035, 0.025, 2.12),
        B.white,
        0.004,
    )
for dz in [-1.055, 1.055]:
    B.box(
        "Portrait ivory trim",
        (px, py - 0.23, pz + dz),
        (2.10, 0.025, 0.035),
        B.white,
        0.004,
    )
photo = bpy.data.images.load(str(ROOT / "assets/reference/headshot.jpeg"))
photo.pack()
material = bpy.data.materials.new("Matthew original headshot")
material.use_nodes = True
node = material.node_tree.nodes.new("ShaderNodeTexImage")
node.image = photo
bsdf = material.node_tree.nodes.get("Principled BSDF")
material.node_tree.links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.82
image = B.mesh(
    "Matthew headshot photograph",
    [
        (px - 1.01, py - 0.245, pz - 1.01),
        (px + 1.01, py - 0.245, pz - 1.01),
        (px + 1.01, py - 0.245, pz + 1.01),
        (px - 1.01, py - 0.245, pz + 1.01),
    ],
    [(0, 1, 2, 3)],
    material,
)
uv = image.data.uv_layers.new()
coords = [(0, 0), (1, 0), (1, 1), (0, 1)]
for polygon in image.data.polygons:
    for index in polygon.loop_indices:
        uv.data[index].uv = coords[image.data.loops[index].vertex_index]
image["href"] = "/about/"
image["futureInteraction"] = "portrait-dialog"
image["photoIsOriginal"] = True

# Lean the entire frame, preserving square UVs and the original likeness.
portrait_root = bpy.data.objects.new("Portrait frame pivot", None)
bpy.context.collection.objects.link(portrait_root)
portrait_root.location = (px, py, pz)
bpy.context.view_layer.update()
for part in set(bpy.context.scene.objects) - portrait_before - {portrait_root}:
    matrix = part.matrix_world.copy()
    part.parent = portrait_root
    part.matrix_world = matrix
portrait_root.rotation_euler.x = math.radians(-20)

# Folded easel feet physically support the leaning portrait above the leaf.
for x in [px - 0.96, px + 0.96]:
    foot = B.mesh(
        "Portrait folded easel support",
        [
            (x, 1.20, 0.94),
            (x, 1.14, B.height(x) + 0.04),
            (x, 2.02, B.height(x) + B.rear_fold(2.02) + 0.04),
            (x, 1.94, 1.70),
        ],
        [(0, 1, 2, 3)],
        B.blue,
    )
    foot.modifiers.new("Paper support thickness", "SOLIDIFY").thickness = 0.035

# Folded CV panel: only the actual destination/title, no invented credentials.
cv = B.box("CV standing page", (3.40, 1.79, 1.84), (1.82, 0.045, 2.05), B.white, 0.009)
cv["href"] = "/experience/"
B.mesh(
    "CV return fold",
    [(4.31, 1.79, 0.81), (4.31, 1.79, 2.87), (4.60, 2.16, 2.72), (4.60, 2.16, 0.84)],
    [(0, 1, 2, 3)],
    B.paper,
)
B.text(
    "CV heading",
    "Experience / CV",
    (2.65, 1.758, 2.48),
    0.16,
    B.font,
    rotation=(math.pi / 2, 0, 0),
)
for row in range(4):
    z = 2.16 - row * 0.28
    B.box("CV printed bullet", (2.71, 1.755, z), (0.045, 0.006, 0.045), B.blue, 0.001)
    B.line(
        "CV decorative text rule", [(2.84, 1.754, z), (3.97, 1.754, z)], slate, 0.009
    )
    B.line(
        "CV decorative text detail",
        [(2.84, 1.754, z - 0.09), (3.63, 1.754, z - 0.09)],
        slate,
        0.005,
    )

# Strategy table: ivory grid, tactile blocks, pyramids and blue/coral pawns.
board = B.box("Strategy board", (2.12, -0.46, 0.68), (4.73, 2.42, 0.13), B.paper, 0.025)
board["href"] = "/about/"
B.box(
    "Strategy board playing surface",
    (2.12, -0.46, 0.757),
    (4.55, 2.25, 0.025),
    B.white,
    0.006,
)
for i in range(10):
    x = -0.1 + i * 0.49
    B.line("Strategy board grid", [(x, -1.56, 0.774), (x, 0.63, 0.774)], B.edge, 0.003)
for j in range(6):
    y = -1.56 + j * 0.44
    B.line("Strategy board grid", [(-0.1, y, 0.775), (4.34, y, 0.775)], B.edge, 0.003)
for x, y in [(0.52, 0.26), (1.02, -0.65), (3.22, -1.05)]:
    B.box("Blue strategy cube", (x, y, 0.965), (0.38, 0.38, 0.38), B.blue, 0.016)
for x, y in [(2.16, 0.35), (2.09, -1.02)]:
    bpy.ops.mesh.primitive_cone_add(
        vertices=4,
        radius1=0.30,
        radius2=0,
        depth=0.60,
        location=(x, y, 1.07),
        rotation=(0, 0, math.pi / 4),
    )
    bpy.context.object.name = "Folded blue strategy pyramid"
    bpy.context.object.data.materials.append(B.blue)


def pawn(name, x, y, color):
    bpy.ops.mesh.primitive_cone_add(
        vertices=10, radius1=0.19, radius2=0.115, depth=0.36, location=(x, y, 0.96)
    )
    o = bpy.context.object
    o.name = name + " body"
    o.data.materials.append(color)
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=20, ring_count=12, radius=0.14, location=(x, y, 1.25)
    )
    o = bpy.context.object
    o.name = name + " head"
    o.data.materials.append(color)


for name, x, y, color in [
    ("Blue pawn", 1.32, 0.36, B.blue),
    ("Blue pawn", 3.14, 0.21, B.blue),
    ("Coral pawn", 2.35, -0.39, B.coral),
    ("Coral pawn", 3.89, -0.36, B.coral),
]:
    pawn(name, x, y, color)


# Two independently editable paper hands with palms, articulated fingers and cuffs.
# Segment boxes follow sculpted 3D joint positions; no flat hand photographs.
def hand(name, origin, angle, pose):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.location = origin
    root.rotation_euler.z = angle

    def own(o):
        o.parent = root
        return o

    outline = [
        (-0.30, -0.43),
        (0.29, -0.43),
        (0.38, 0.15),
        (0.29, 0.45),
        (-0.24, 0.50),
        (-0.40, 0.11),
    ]
    v = [(x, y, z) for z in [-0.075, 0.075] for x, y in outline]
    n = len(outline)
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [
        (i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)
    ]
    palm = own(B.mesh(name + " palm", v, faces, handpaper))
    bevel = palm.modifiers.new("Folded palm bevel", "BEVEL")
    bevel.width = 0.05
    bevel.segments = 3

    def finger(label, points, width):
        for i, (a, b) in enumerate(zip(points, points[1:])):
            a, b = Vector(a), Vector(b)
            o = B.box(
                name + " " + label + " segment " + str(i),
                (a + b) / 2,
                (width, 0.14, (b - a).length + 0.04),
                handpaper,
                0.045,
            )
            o.rotation_euler = (b - a).to_track_quat("Z", "Y").to_euler()
            own(o)

    for i, x in enumerate([-0.22, -0.055, 0.115, 0.27]):
        length = [0.74, 0.84, 0.72, 0.53][i]
        if pose == "pinch" and i == 0:
            points = [
                (x, 0.31, 0.03),
                (x - 0.05, 0.72, 0.21),
                (x - 0.12, 0.99, 0.12),
                (x - 0.16, 1.06, -0.01),
            ]
        else:
            points = [
                (x, 0.30, 0.03),
                (x, 0.30 + length * 0.48, 0.10),
                (x, 0.30 + length * 0.85, 0.0),
                (x, 0.30 + length, -0.14),
            ]
        finger(
            ["index", "middle", "ring", "little"][i], points, 0.14 if i < 2 else 0.13
        )
    finger(
        "thumb",
        [
            (-0.30, -0.04, 0.02),
            (-0.54, 0.21, 0.12),
            (-0.57, 0.65, 0.17),
            (-0.40, 0.88, 0.06),
        ],
        0.19,
    )
    own(
        B.box(name + " wrist", (0, -0.60, -0.005), (0.52, 0.43, 0.19), handpaper, 0.045)
    )
    own(
        B.box(
            name + " ivory cuff", (0, -0.81, -0.01), (0.66, 0.27, 0.25), B.white, 0.018
        )
    )
    own(
        B.box(
            name + " cobalt sleeve",
            (0, -1.13, -0.015),
            (0.76, 0.51, 0.30),
            B.blue,
            0.025,
        )
    )
    # Short scored creases reinforce paper rather than fleshy skin.
    for x in [-0.18, 0.02, 0.20]:
        own(
            B.line(
                name + " palm crease",
                [(x, -0.10, 0.079), (x + 0.03, 0.10, 0.081)],
                B.paper,
                0.004,
            )
        )
    return root


hand("Left paper hand", (0.05, -1.48, 1.04), math.radians(-39), "pinch")
hand("Right paper hand", (4.67, -0.27, 1.08), math.radians(83), "pinch")
B.studio_and_export(OUT, "about")
