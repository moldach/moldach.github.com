"""Editable Contact chapter: a folded-paper conversation room.
Run: blender --background --python tool/assets/build_contact.py
Offline asset only. Destination metadata does not implement form submission.
"""

import sys
import math
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
import paper_scene as B  # noqa: E402

OUT = B.ROOT / "research/models/contact"
B.make_book(5)
arch_blue = B.mat("Architectural cobalt paper", (0.006, 0.048, 0.19))
crease_blue = B.mat("Arch scored seam", (0.025, 0.085, 0.22))
coral = B.mat("Coral table paper", (0.82, 0.20, 0.065))
CONTACT = "/contact/"
EMAIL = "mailto:moldach686@gmail.com"


# Print follows the curved reading leaf, not a flat floating overlay.
def printed(name, body, x, y, size, font=B.font):
    o = B.text(name, body, (x, y, 1.0), size, font)
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


printed("Contact heading first", "What could", -4.45, 2.27, 0.51, B.bold)
printed("Contact heading second", "work better?", -4.45, 1.84, 0.46, B.bold)
printed(
    "Contact subtitle", "Let’s find a useful place to start.", -4.43, 1.65, 0.16, B.sans
)


def cylinder(name, loc, radius, depth, material, vertices=96):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=loc
    )
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    bevel = o.modifiers.new("Soft cut rim", "BEVEL")
    bevel.width = 0.018
    bevel.segments = 3
    return o


def oval(name, cx, cy, z, rx, ry, depth, material):
    o = cylinder(name, (cx, cy, z), 1, depth, material)
    o.scale = (rx, ry, 1)
    return o


# Thin folded stage with angular fore-edge folds and an oval paper rug.
platform = B.mesh(
    "Conversation folded platform",
    [
        (-2.3, -1.9, 0.44),
        (2.8, -1.9, 0.44),
        (3.0, -1.25, 0.44),
        (2.62, 0.84, 0.55),
        (-1.8, 0.84, 0.55),
        (-2.6, -0.8, 0.46),
    ],
    [(0, 1, 2, 3, 4, 5)],
    B.white,
)
platform.modifiers.new("Folded platform thickness", "SOLIDIFY").thickness = 0.10
oval("Cobalt conversation floor", 0.42, -0.40, 0.55, 2.55, 1.36, 0.035, arch_blue)
oval("Cream paper rug rim", 0.42, -0.45, 0.59, 2.22, 1.15, 0.045, B.white)
oval("Cobalt rug center", 0.42, -0.45, 0.62, 1.94, 0.94, 0.018, arch_blue)
B.box("Left plant stage", (-3.12, -0.44, 0.52), (1.85, 1.37, 0.14), B.white, 0.007)
B.box("Right invitation stage", (3.55, -0.02, 0.55), (2.1, 1.48, 0.17), B.white, 0.008)
# Side pleats and a folded inner backdrop, each with a real score/fold axis.
for i in range(13):
    x = -3.96 + i * 0.18
    y = 0.70 + (i % 2) * 0.13
    top = 0.94 + 0.12 * math.sin(i * 0.55)
    o = B.mesh(
        "Left architectural pleat",
        [
            (x, y, 0.60),
            (x + 0.18, 0.70 + ((i + 1) % 2) * 0.13, 0.60),
            (x + 0.18, 0.70 + ((i + 1) % 2) * 0.13, top),
            (x, y, top),
        ],
        [(0, 1, 2, 3)],
        B.paper if i % 2 else B.white,
    )
    o.modifiers.new("Pleat thickness", "SOLIDIFY").thickness = 0.015
for i in range(22):
    x = -0.85 + i * 0.16
    y = 1.95 + (i % 2) * 0.16
    top = 2.50 + 0.24 * math.sin(i * 0.22)
    o = B.mesh(
        "Room folded backdrop",
        [
            (x, y, 0.67),
            (x + 0.16, 1.95 + ((i + 1) % 2) * 0.16, 0.67),
            (x + 0.16, 1.95 + ((i + 1) % 2) * 0.16, top),
            (x, y, top),
        ],
        [(0, 1, 2, 3)],
        B.white if i % 2 else B.paper,
    )
    o.modifiers.new("Backdrop thickness", "SOLIDIFY").thickness = 0.018
# A single continuous upper semicircle, with thickness and two open-room legs.
cx, cy, spring = 0.42, 1.22, 2.05
outer, inner = 1.90, 1.49
verts = []
segments = 112
for y in [cy - 0.18, cy + 0.18]:
    for radius in [outer, inner]:
        for i in range(segments + 1):
            a = i * math.pi / segments
            verts.append((cx + radius * math.cos(a), y, spring + radius * math.sin(a)))
stride = segments + 1
faces = []
for i in range(segments):
    faces.extend(
        [
            (i, i + 1, stride + i + 1, stride + i),
            (2 * stride + i, 3 * stride + i, 3 * stride + i + 1, 2 * stride + i + 1),
            (i, 2 * stride + i, 2 * stride + i + 1, i + 1),
            (stride + i, stride + i + 1, 3 * stride + i + 1, 3 * stride + i),
        ]
    )
faces.extend(
    [
        (0, stride, 3 * stride, 2 * stride),
        (segments, 2 * stride + segments, 3 * stride + segments, stride + segments),
    ]
)
arch = B.mesh("Open cobalt conversation arch", verts, faces, arch_blue)
arch["href"] = CONTACT
bevel = arch.modifiers.new("Paper arch edge", "BEVEL")
bevel.width = 0.018
bevel.segments = 3
for side in [-1, 1]:
    B.box(
        "Arch standing leg",
        (cx + side * (outer + inner) / 2, cy, 1.35),
        (outer - inner, 0.36, 1.40),
        arch_blue,
        0.015,
    )
for i in range(1, 12):
    a = i * math.pi / 12
    B.line(
        "Arch radial paper seam",
        [
            (cx + inner * math.cos(a), cy - 0.181, spring + inner * math.sin(a)),
            (cx + outer * math.cos(a), cy - 0.181, spring + outer * math.sin(a)),
        ],
        crease_blue,
        0.004,
    )


# Curved tub-chair shells: a rounded U-shaped paper cross section, not cube arms.
def chair(name, x, y, angle):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.location = (x, y, 0)
    root.rotation_euler.z = angle

    def own(o):
        o.parent = root
        return o

    cross = [
        (0, 0),
        (0, 0.83),
        (0.07, 0.97),
        (0.30, 1),
        (0.76, 1),
        (0.94, 0.96),
        (1, 0.83),
        (1, 0),
    ]
    verts = []
    count = 80
    for i in range(count + 1):
        a = -0.33 + (math.pi + 0.66) * i / count
        top = 1.32 + 0.53 * max(0, math.sin(a))
        base = 0.79
        for t, h in cross:
            rx = 0.61 * (1 - t) + 0.45 * t
            ry = 0.51 * (1 - t) + 0.35 * t
            verts.append((rx * math.cos(a), ry * math.sin(a), base + (top - base) * h))
    faces = []
    m = len(cross)
    for i in range(count):
        for j in range(m):
            a = i * m + j
            b = i * m + (j + 1) % m
            faces.append((a, b, b + m, a + m))
    faces.extend([tuple(range(m - 1, -1, -1)), tuple(count * m + j for j in range(m))])
    shell = own(B.mesh(name + " continuous curved shell", verts, faces, B.white))
    for polygon in shell.data.polygons:
        polygon.use_smooth = True
    own(
        B.box(
            name + " rounded base", (0, 0.015, 0.88), (1.13, 0.98, 0.30), B.white, 0.13
        )
    )
    own(
        B.box(
            name + " seat cushion",
            (0, -0.035, 1.075),
            (0.96, 0.82, 0.20),
            B.white,
            0.09,
        )
    )
    pillow = own(
        B.box(
            name + " cobalt pillow",
            (0, 0.265, 1.43),
            (0.56, 0.16, 0.43),
            arch_blue,
            0.065,
        )
    )
    pillow.rotation_euler.x = math.radians(-12)
    for dx in [-0.36, 0.36]:
        for dy in [-0.30, 0.30]:
            own(
                B.box(
                    name + " folded foot",
                    (dx, dy, 0.70),
                    (0.09, 0.09, 0.18),
                    B.paper,
                    0.012,
                )
            )
    root["href"] = CONTACT
    return root


chair("Left cream paper chair", -0.84, -0.12, math.radians(22))
chair("Right cream paper chair", 1.67, -0.12, math.radians(-22))
# Tapered coral pedestal and circular top.
bpy.ops.mesh.primitive_cone_add(
    vertices=96, radius1=0.37, radius2=0.27, depth=0.59, location=(0.42, -0.86, 0.96)
)
pedestal = bpy.context.object
pedestal.name = "Coral table tapered pedestal"
pedestal.data.materials.append(coral)
top = cylinder("Coral circular tabletop", (0.42, -0.86, 1.29), 0.85, 0.095, coral)
top["href"] = CONTACT


# Blue paper plants, each with scored leaf ridges.
def plant(name, x, y, z, size):
    B.box(
        name + " folded pot",
        (x, y, z + 0.19 * size),
        (0.43 * size, 0.43 * size, 0.38 * size),
        B.white,
        0.015,
    )
    base = z + 0.38 * size
    for i in range(8):
        a = i * math.tau / 8
        h = (0.57 + (i % 3) * 0.12) * size
        r = (0.22 + (i % 2) * 0.10) * size
        bottom = (x, y, base)
        tip = (x + math.cos(a) * r, y + math.sin(a) * r, base + h)
        mid = (x + math.cos(a) * r * 0.65, y + math.sin(a) * r * 0.65, base + h * 0.55)
        w = 0.09 * size
        left = (mid[0] - math.sin(a) * w, mid[1] + math.cos(a) * w, mid[2])
        right = (mid[0] + math.sin(a) * w, mid[1] - math.cos(a) * w, mid[2])
        ridge = (mid[0], mid[1], mid[2] + 0.045 * size)
        B.mesh(
            name + " folded leaf",
            [bottom, left, tip, right, ridge],
            [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)],
            arch_blue,
        )


plant("Left lounge plant", -3.15, -0.49, 0.59, 1.18)
plant("Right lounge plant", 2.77, 0.45, 0.65, 0.80)
plant("Tabletop plant", 0.42, -0.83, 1.34, 0.38)


# Two actual rounded speech-bubble panels with dimensional tails.
def bubble(name, x, y, z, width, height, ink):
    o = B.box(name + " panel", (x, y, z), (width, 0.07, height), B.white, 0.085)
    o["href"] = CONTACT
    B.mesh(
        name + " folded tail",
        [
            (x - width * 0.24, y - 0.036, z - height / 2 + 0.03),
            (x - width * 0.24, y - 0.036, z - height / 2 - 0.25),
            (x - width * 0.04, y - 0.036, z - height / 2 + 0.03),
        ],
        [(0, 1, 2)],
        B.white,
    ).modifiers.new("Tail thickness", "SOLIDIFY").thickness = 0.025
    for row, w in enumerate([0.72, 0.56, 0.38]):
        B.box(
            name + " printed line",
            (x - 0.04, y - 0.043, z + height * 0.22 - row * 0.13),
            (w, 0.012, 0.021),
            ink,
            0.003,
        )


bubble("Listening bubble", -0.30, 0.88, 2.76, 1.27, 0.66, B.blue)
bubble("Reply bubble", 0.91, 0.77, 2.40, 1.24, 0.65, coral)

# An invitation, not a rasterized or pretend working form.
card_before = set(bpy.context.scene.objects)
invite = B.box(
    "Contact invitation", (3.74, 0.22, 1.64), (1.87, 0.055, 1.88), B.white, 0.009
)
invite["href"] = CONTACT
B.text(
    "Invitation heading",
    "Start a\nconversation",
    (2.91, 0.181, 2.21),
    0.25,
    B.font,
    rotation=(math.pi / 2, 0, 0),
)
B.line(
    "Invitation action arrow shaft",
    [(4.24, 0.174, 1.91), (4.51, 0.174, 1.91)],
    B.ink,
    0.009,
)
B.line(
    "Invitation action arrow head",
    [(4.43, 0.174, 1.99), (4.51, 0.174, 1.91), (4.43, 0.174, 1.83)],
    B.ink,
    0.009,
)
B.line(
    "Invitation printed divider",
    [(2.93, 0.178, 1.49), (4.52, 0.178, 1.49)],
    B.edge,
    0.004,
)
email = B.text(
    "Email invitation",
    "Or send an email",
    (2.93, 0.178, 1.19),
    0.17,
    B.sans,
    rotation=(math.pi / 2, 0, 0),
)
email["href"] = EMAIL
pivot = bpy.data.objects.new("Invitation fold pivot", None)
bpy.context.collection.objects.link(pivot)
pivot.location = (3.74, 0.22, 1.64)
bpy.context.view_layer.update()
for o in set(bpy.context.scene.objects) - card_before - {pivot}:
    matrix = o.matrix_world.copy()
    o.parent = pivot
    o.matrix_world = matrix
pivot.rotation_euler.x = math.radians(-12)
for x in [3.05, 4.43]:
    B.mesh(
        "Invitation folded support",
        [(x, 0.01, 0.70), (x, 0.57, 0.70), (x, 0.34, 1.55)],
        [(0, 1, 2)],
        B.paper,
    ).modifiers.new("Support thickness", "SOLIDIFY").thickness = 0.025
# Small abstract paper keepsakes, not an invented client project.
for i, color in enumerate([B.blue, coral, B.paper]):
    B.box(
        "Invitation paper book",
        (4.02 + i * 0.16, -0.50, 0.82),
        (0.12, 0.24, 0.32),
        color,
        0.008,
    )
B.studio_and_export(OUT, "contact", camera_location=(0.12, -15, 11.8), camera_lens=59)
