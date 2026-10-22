"""Build an editable Services spread; render before browser integration.
Run: blender -b --python tool/assets/build_services.py
All geometry is authored here. Reference illustration is not projected on meshes.
"""

import bpy
import math
import random
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "research/models/services"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
random.seed(73)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1536
scene.render.resolution_y = 1024
scene.render.resolution_percentage = 100
scene.world.color = (0.45, 0.45, 0.45)
scene.view_settings.exposure = 0.45
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
bpy.context.preferences.filepaths.save_version = 0
scene.render.image_settings.file_format = "PNG"


def mat(name, color, paper=True):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    n = m.node_tree.nodes
    p = n.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = 0.86
    if paper:
        noise = n.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 150
        noise.inputs["Detail"].default_value = 3
        bump = n.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.22
        bump.inputs["Distance"].default_value = 0.025
        m.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        m.node_tree.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    return m


paper = mat("Ivory paper with fibers", (0.78, 0.69, 0.55))
white = mat("Folded cream card", (0.91, 0.84, 0.70))
edge = mat("Leaf edges", (0.64, 0.52, 0.36))
blue = mat("Cobalt cloth", (0.004, 0.02, 0.08))
blueprint = mat("Cobalt drafting paper", (0.006, 0.040, 0.16))
coral = mat("Coral paper", (0.69, 0.16, 0.065))
ink = mat("Printed navy", (0.008, 0.024, 0.049), False)
grid = mat("Blueprint hairlines", (0.38, 0.57, 0.67), False)
muted = mat("Printed pale slate", (0.26, 0.39, 0.45), False)


def mesh(name, verts, faces, material):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    o = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    return o


def box(name, loc, scale, material=white, bevel=0.018):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        mod = o.modifiers.new("Paper edge bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod = o.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return o


def line(name, points, material=white, width=0.012):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 20
    data.bevel_depth = width
    data.bevel_resolution = 1
    s = data.splines.new("POLY")
    s.points.add(len(points) - 1)
    for p, co in zip(s.points, points):
        p.co = (*co, 1)
    o = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    return o


font = bpy.data.fonts.load("/System/Library/Fonts/Supplemental/Georgia.ttf")
bold = bpy.data.fonts.load("/System/Library/Fonts/Supplemental/Georgia Bold.ttf")
sans = bpy.data.fonts.load("/System/Library/Fonts/Supplemental/Arial.ttf")


def text(
    name, body, loc, size=0.2, font=font, material=ink, rotation=(0, 0, 0), align="LEFT"
):
    c = bpy.data.curves.new(name, "FONT")
    c.body = body
    c.font = font
    c.size = size
    c.align_x = align
    c.extrude = 0
    c.resolution_u = 12
    o = bpy.data.objects.new(name, c)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rotation
    c.materials.append(material)
    return o


def height(x):
    t = min(1, abs(x) / 5)
    return 0.20 + 0.30 * math.sin(math.pi * t) + 0.13 * t


def rear_fold(y):
    return max(0, y - 1.3) ** 1.3 * 0.65


def curved_sheet(name, zoff, material, width=10, depth=5.6):
    nx, ny = 120, 12
    v = []
    f = []
    for j in range(ny + 1):
        y = -depth / 2 + depth * j / ny
        for i in range(nx + 1):
            x = -width / 2 + width * i / nx
            v.append((x, y, height(x) + rear_fold(y) + zoff))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            f.append((a, a + 1, a + nx + 2, a + nx + 1))
    o = mesh(name, v, f, material)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


# Cloth boards and a genuine curved spine, then individually curved layered leaves.
curved_sheet("Cobalt lower cover", -0.49, blue, 10.35, 5.87)
for i in range(30):
    curved_sheet(
        f"Paper leaf {i:02}",
        -0.445 + i * 0.015,
        edge if i % 4 == 0 else paper,
        10 + i * 0.0015,
        5.6 + i * 0.002,
    )
curved_sheet("Reading spread", 0.013, white)
for y in [-2.83, 2.83]:
    for layer in range(30):
        line(
            f"Leaf fore-edge {y} {layer}",
            [
                (x, y, height(x) + rear_fold(y) - 0.445 + layer * 0.015)
                for x in [-5 + i / 12 for i in range(121)]
            ],
            paper if layer % 4 else edge,
            0.005,
        )
# Tactile lower fore-edge tags.
for i, label in enumerate(["Start", "Services", "Work", "Writing", "About", "Contact"]):
    x = -3.9 + i * 1.53
    tab = box(
        "Chapter tab " + label,
        (x, -3.02, -0.06),
        (1.19, 0.50, 0.055),
        blue if i == 1 else white,
        0.032,
    )
    tab["chapterIndex"] = i
    text(
        "Printed " + label,
        label,
        (x, -3.08, -0.027),
        0.18,
        sans,
        white if i == 1 else ink,
        align="CENTER",
    )
# Blueprint folio follows the curved paper with a crisp central score.
curved_sheet("Fold-out blueprint", 0.043, blueprint, 9.5, 4.05)
for x in [-4.6 + i * 0.24 for i in range(39)]:
    line(
        "Fine vertical drafting rule",
        [
            (x, y, height(x) + rear_fold(y) + 0.051)
            for y in [-2.02 + j * 0.101 for j in range(41)]
        ],
        grid,
        0.0025,
    )
for y in [-1.92 + i * 0.24 for i in range(17)]:
    line(
        "Fine horizontal drafting rule",
        [
            (x, y, height(x) + rear_fold(y) + 0.052)
            for x in [-4.74 + i * 0.079 for i in range(121)]
        ],
        grid,
        0.0025,
    )
# Raised side folds give the blueprint its physical folio silhouette.
for side in [-1, 1]:
    x = side * 4.75
    wall = mesh(
        "Folded blueprint side wall",
        [
            (x, -2.02, height(x) + 0.05),
            (x, 2.02, height(x) + 0.05),
            (x + side * 0.13, 2.02, height(x) + 0.86),
            (x + side * 0.13, -2.02, height(x) + 0.10),
        ],
        [(0, 1, 2, 3)],
        blueprint,
    )
    for j in range(17):
        y = -2.02 + j * 0.2525
        rise = 0.10 + 0.76 * j / 16
        line(
            "Side fold drafting rule",
            [(x, y, height(x) + 0.055), (x + side * 0.13, y, height(x) + rise)],
            grid,
            0.0025,
        )
# Printed ivory routes, arrowheads and connection markers on the drafting surface.
for route in [
    [(-4.2, 1.0), (-1.8, 1.0), (-1.5, 0.6)],
    [(-4.3, -0.9), (-4.3, -1.82), (-1.8, -1.82)],
    [(1.25, 0.9), (1.85, 0.9), (1.85, 0.2)],
    [(1.4, -0.5), (1.8, -1.82), (4.1, -1.82)],
]:
    data = bpy.data.curves.new("Printed routing curve", "CURVE")
    data.dimensions = "3D"
    data.bevel_depth = 0.011
    data.bevel_resolution = 2
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(route) - 1)
    for point, (x, y) in zip(spline.bezier_points, route):
        point.co = (x, y, height(x) + 0.067)
        point.handle_left_type = point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new("Printed ivory workflow route", data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(white)
    x, y = route[0]
    line(
        "Printed connection marker",
        [
            (
                x + 0.04 * math.cos(t * math.pi / 12),
                y + 0.04 * math.sin(t * math.pi / 12),
                height(x) + 0.071,
            )
            for t in range(25)
        ],
        white,
        0.008,
    )
    x, y = route[-1]
    mesh(
        "Printed arrowhead",
        [
            (x - 0.065, y + 0.10, height(x) + 0.072),
            (x + 0.065, y + 0.10, height(x) + 0.072),
            (x, y - 0.025, height(x) + 0.072),
        ],
        [(0, 1, 2)],
        white,
    )

# Upper title on exposed paper, conform its mesh to the reading leaf.
heading = text(
    "Services heading", "Make the work flow.", (-4.45, 2.26, 0.8), 0.48, bold
)
bpy.context.view_layer.objects.active = heading
heading.select_set(True)
bpy.ops.object.convert(target="MESH")
heading = bpy.context.object
for v in heading.data.vertices:
    v.co.z = (
        height(v.co.x + heading.location.x)
        + rear_fold(v.co.y + heading.location.y)
        + 0.034
        - heading.location.z
    )
heading.select_set(False)
footer = text(
    "Small footer",
    "From repeatable workflows to useful automation.",
    (4.3, -2.51, height(4.3) + 0.025),
    0.12,
    sans,
    align="RIGHT",
)
bpy.ops.object.select_all(action="DESELECT")
footer.select_set(True)
bpy.context.view_layer.objects.active = footer
bpy.ops.object.convert(target="MESH")
footer = bpy.context.object
for vertex in footer.data.vertices:
    vertex.co.z = height(vertex.co.x + footer.location.x) + 0.026 - footer.location.z
footer.select_set(False)

# Three folded stages, front nameplates and paper support gussets.
labels = ["Find the opportunity", "Build a focused solution", "Help the team adopt it"]
for i, cx in enumerate([-3.2, 0, 3.2]):
    z = height(cx) + 0.14
    box(f"Folded platform {i}", (cx, -0.03, z), (2.55, 2.15, 0.075), white, 0.008)
    for side in [-1, 1]:
        x = cx + side * 1.22
        mesh(
            "Triangular paper gusset",
            [(x, -1.25, z - 0.04), (x, -0.93, z - 0.04), (x, -0.93, z - 0.29)],
            [(0, 1, 2)],
            paper,
        )
    plate = box(
        "Folded front nameplate",
        (cx, -1.10, z + 0.14),
        (2.5, 0.42, 0.045),
        white,
        0.009,
    )
    plate.rotation_euler.x = math.radians(35)
    label = text(
        "Engagement " + str(i),
        labels[i],
        (cx, -1.23, z + 0.13),
        0.177,
        bold,
        align="CENTER",
    )
    label.rotation_euler.x = math.radians(35)
    plate["href"] = [
        "/services/ai-opportunity-assessment/",
        "/services/ai-workflow-automation/",
        "/services/ai-training-adoption/",
    ][i]


# Opportunity: a thick, beveled paper annulus (not a metallic torus).
def ring(name, radius, inner, depth, loc, rotation, material):
    n = 96
    verts = []
    faces = []
    for z in [-depth / 2, depth / 2]:
        for r in [radius, inner]:
            verts.extend(
                [
                    (
                        r * math.cos(i * 2 * math.pi / n),
                        r * math.sin(i * 2 * math.pi / n),
                        z,
                    )
                    for i in range(n)
                ]
            )
    for i in range(n):
        j = (i + 1) % n
        faces.extend(
            [
                (i, j, n + j, n + i),
                (2 * n + i, 3 * n + i, 3 * n + j, 2 * n + j),
                (i, 2 * n + i, 2 * n + j, j),
                (n + i, n + j, 3 * n + j, 3 * n + i),
            ]
        )
    o = mesh(name, verts, faces, material)
    o.location = loc
    o.rotation_euler = rotation
    b = o.modifiers.new("Soft cut edges", "BEVEL")
    b.width = 0.018
    b.segments = 3
    return o


rot = (math.radians(68), 0, math.radians(-12))
ring("Paper magnifier rim", 0.82, 0.66, 0.14, (-3.22, 0.42, 1.75), rot, white)
ring("Inner lens mounting", 0.666, 0.637, 0.12, (-3.22, 0.42, 1.75), rot, muted)
# A real transmissive lens, separate from its paper mounting.
bpy.ops.mesh.primitive_circle_add(
    vertices=96,
    radius=0.633,
    fill_type="NGON",
    location=(-3.22, 0.42, 1.75),
    rotation=rot,
)
lens = bpy.context.object
lens.name = "Thin transparent magnifier lens"
glass = mat("Subtle clear lens", (0.88, 0.94, 0.98), False)
glass.node_tree.nodes["Principled BSDF"].inputs[
    "Transmission Weight"
].default_value = 0.92
glass.node_tree.nodes["Principled BSDF"].inputs["IOR"].default_value = 1.12
glass.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.09
lens.data.materials.append(glass)
lens.modifiers.new("Lens thickness", "SOLIDIFY").thickness = 0.013

# Thick folded handle aligned diagonally, separate from rim.
a = Vector((-3.65, 0.10, 1.17))
b = Vector((-4.03, -0.59, 0.72))
handle = box(
    "Folded magnifier handle", (a + b) / 2, (0.21, 0.17, (a - b).length), white, 0.02
)
handle.rotation_euler = (a - b).to_track_quat("Z", "Y").to_euler()
# Cards under the lens stand in a shallow paper cradle.
box("Task card stand", (-3.23, 0.33, 0.76), (1.28, 0.78, 0.13), paper, 0.01)
for i in range(4):
    card = box(
        "Opportunity task card",
        (-3.2, 0.43 + i * 0.10, 1.38 + i * 0.06),
        (1.09, 0.025, 0.99),
        white,
        0.006,
    )
    card.rotation_euler.x = math.radians(-9)
    for row in range(3):
        z = 1.17 + row * 0.21 + i * 0.06
        y = 0.40 + i * 0.10
        line(
            "Checkbox",
            [
                (-3.60, y, z),
                (-3.49, y, z),
                (-3.49, y, z + 0.10),
                (-3.60, y, z + 0.10),
                (-3.60, y, z),
            ],
            coral if row == 0 else muted,
            0.009,
        )
        line(
            "Task description",
            [(-3.39, y, z + 0.04), (-2.89, y, z + 0.04)],
            muted,
            0.013,
        )
# Implementation: seven upright folded rectangular nodes with printed headers.
centers = [
    (-0.75, 0.63, 0.74),
    (-0.1, 1.0, 0.95),
    (0.65, 0.62, 0.87),
    (0.03, 0.08, 0.88),
    (-0.65, -0.65, 0.64),
    (0.70, -0.58, 0.68),
    (-0.05, -0.91, 0.59),
]
for i, (x, y, h) in enumerate(centers):
    base = 0.80
    node = box(
        "Folded workflow node " + str(i),
        (x, y, base + h / 2),
        (0.40, 0.15, h),
        coral if i == 3 else white,
        0.009,
    )
    node["href"] = "/services/ai-workflow-automation/"
    box(
        "Node return fold",
        (x + 0.21, y + 0.04, base + h / 2),
        (0.05, 0.27, h),
        paper,
        0.004,
    )
    line(
        "Node header",
        [
            (x - 0.13, y - 0.081, base + h - 0.15),
            (x + 0.13, y - 0.081, base + h - 0.15),
        ],
        white if i == 3 else blue,
        0.022,
    )
    for j in range(2):
        line(
            "Node detail",
            [
                (x - 0.12, y - 0.082, base + h - 0.28 - j * 0.09),
                (x + 0.08, y - 0.082, base + h - 0.28 - j * 0.09),
            ],
            white if i == 3 else muted,
            0.009,
        )
for a, b in [(0, 1), (1, 2), (0, 3), (2, 3), (3, 4), (3, 5), (4, 6), (5, 6)]:
    x, y, _ = centers[a]
    xx, yy, _ = centers[b]
    mid = (y + yy) / 2
    line(
        "Paper dependency rail",
        [(x, y, 0.79), (x, mid, 0.79), (xx, mid, 0.79), (xx, yy, 0.79)],
        white,
        0.028,
    )


# Manual: a curved open book leaning back on its paper stand.
def manual_point(side, u, v, offset=0):
    return (
        3.2 + side * u * 1.04,
        0.20 + v * 0.90 - 0.20 * u + 0.05 * math.sin(math.pi * u) + offset,
        0.95 + v * 1.45 + 0.10 * math.sin(math.pi * u),
    )


for side in [-1, 1]:
    for layer in range(5):
        verts = []
        faces = []
        nx, ny = 20, 15
        for j in range(ny + 1):
            for i in range(nx + 1):
                x, y, z = manual_point(side, i / nx, j / ny, layer * 0.016)
                verts.append((x, y, z - layer * 0.008))
        for j in range(ny):
            for i in range(nx):
                a = j * (nx + 1) + i
                faces.append((a, a + 1, a + nx + 2, a + nx + 1))
        page = mesh("Curved manual leaf", verts, faces, white if layer == 0 else paper)
        for polygon in page.data.polygons:
            polygon.use_smooth = True
    for row in range(4):
        v = 0.82 - row * 0.18
        if side == -1:
            line(
                "Manual checkbox",
                [
                    manual_point(side, u, v + vv, -0.012)
                    for u, vv in [
                        (0.78, 0),
                        (0.67, 0),
                        (0.67, 0.07),
                        (0.78, 0.07),
                        (0.78, 0),
                    ]
                ],
                blue,
                0.008,
            )
            line(
                "Manual instruction",
                [
                    manual_point(side, 0.55, v + 0.035, -0.012),
                    manual_point(side, 0.18, v + 0.035, -0.012),
                ],
                muted,
                0.011,
            )
        else:
            line(
                "Manual hierarchy",
                [
                    manual_point(side, 0.48, v, -0.012),
                    manual_point(side, 0.48, v - 0.12, -0.012),
                    manual_point(side, 0.23, v - 0.12, -0.012),
                    manual_point(side, 0.75, v - 0.12, -0.012),
                ],
                blue,
                0.01,
            )
line(
    "Scored manual spine", [manual_point(1, 0, 0), manual_point(1, 0, 1)], paper, 0.018
)


# Two dimensional paper people: thick extruded silhouettes with faceted shoulders.
def person(name, x, y, color):
    z = 0.8
    w = 0.26
    points = [
        (-w, 0),
        (w, 0),
        (w * 0.85, 0.37),
        (w * 0.53, 0.54),
        (-w * 0.53, 0.54),
        (-w * 0.85, 0.37),
    ]
    v = []
    for d in [-0.09, 0.09]:
        v.extend([(x + xx, y + d, z + zz) for xx, zz in points])
    faces = [tuple(range(5, -1, -1)), tuple(range(6, 12))] + [
        (i, (i + 1) % 6, (i + 1) % 6 + 6, i + 6) for i in range(6)
    ]
    body = mesh(name + " folded body", v, faces, color)
    mod = body.modifiers.new("Paper edges", "BEVEL")
    mod.width = 0.01
    mod.segments = 2
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24, ring_count=12, radius=0.17, location=(x, y, z + 0.73)
    )
    head = bpy.context.object
    head.name = name + " head"
    head.scale = (1, 0.62, 1)
    head.data.materials.append(color)


person("Blue teammate", 2.87, -0.63, blue)
person("Coral teammate", 3.60, -0.50, coral)
# Studio. Export keeps this separate from the book model.
floor = box(
    "Studio floor",
    (0, 0, -0.38),
    (200, 200, 0.10),
    mat("Warm studio background", (0.90, 0.84, 0.74), False),
    0,
)


def area(name, loc, power, size, color):
    d = bpy.data.lights.new(name, "AREA")
    d.energy = power
    d.shape = "DISK"
    d.size = size
    d.color = color
    o = bpy.data.objects.new(name, d)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (
        (Vector((0, 0, 0)) - o.location).to_track_quat("-Z", "Y").to_euler()
    )


area("Large softbox left", (-4, -3, 9), 1300, 7, (1, 0.92, 0.81))
area("Fill softbox", (5, 1, 7), 650, 6, (0.97, 0.97, 1))
area("Rear rim", (-1, 6, 5), 500, 5, (1, 0.94, 0.85))
world = scene.world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (1.0, 0.94, 0.85, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.25
bpy.ops.object.camera_add(location=(0.12, -12, 15))
cam = bpy.context.object
cam.name = "Reference camera"
cam.rotation_euler = (
    (Vector((0, 0, 0.7)) - cam.location).to_track_quat("-Z", "Y").to_euler()
)
cam.data.lens = 57
scene.camera = cam
# Persist editable source. System fonts stay external; export converts text to geometry.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "services.blend"))
scene.render.filepath = str(OUT / "services-render.png")
bpy.ops.render.render(write_still=True)
# A draft geometry export: procedural micro-bump is not baked. Do not claim parity.
for o in bpy.context.selected_objects:
    o.select_set(False)
for o in list(scene.objects):
    if o.type in {"CURVE", "FONT"}:
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.convert(target="MESH")
bpy.ops.object.select_all(action="DESELECT")
for o in scene.objects:
    if o.type == "MESH" and o != floor:
        o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=str(OUT / "services-geometry.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_extras=True,
    export_animations=False,
)
print("SERVICES_ASSET_COMPLETE", str(OUT))
