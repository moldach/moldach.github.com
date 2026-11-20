"""Editable Start study. Run in a fresh background Blender process.
Original article artwork is used only within independent photo and film meshes.
"""

import hashlib
import json
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
import paper_scene as B  # noqa: E402

OUT = B.ROOT / "research/models/start"
ARTICLE = "/writing/faststyletransfer/"
B.make_book(0)
# The owner-approved selection is the single texture registry for this study.
selection = json.loads((OUT / "image-shortlist/selection.json").read_text())
assert {item["number"] for item in selection} == set(range(1, 11))
photos = {}
for item in selection:
    path = B.ROOT / item["previewPath"]
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"], path
    material = bpy.data.materials.new(f"Approved {item['number']:02} {item['title']}")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(path), check_existing=True)
    tex.image.pack()
    material.node_tree.links.new(
        tex.outputs["Color"], nodes.get("Principled BSDF").inputs["Base Color"]
    )
    nodes.get("Principled BSDF").inputs["Roughness"].default_value = 0.77
    photos[item["number"]] = material


def printed(name, body, x, y, size, font=B.font):
    o = B.text(name, body, (x, y, 1), size, font)
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    for v in o.data.vertices:
        v.co.z = B.height(v.co.x + x) + B.rear_fold(v.co.y + y) + 0.03 - o.location.z
    o.select_set(False)
    return o


printed("Opening first line", "Practical AI.", -4.45, 2.23, 0.56, B.bold)
printed("Opening second line", "Less busywork.", -4.45, 1.78, 0.53, B.bold)
printed(
    "Opening subtitle", "Useful systems. Human judgment.", -4.43, 1.57, 0.17, B.sans
)


def textured(name, verts, uv, image_number=1):
    o = B.mesh(name, verts, [tuple(range(len(verts)))], photos[image_number])
    o["approvedImageNumber"] = image_number
    layer = o.data.uv_layers.new(name="Original image UV")
    for p in o.data.polygons:
        for i in p.loop_indices:
            layer.data[i].uv = uv[o.data.loops[i].vertex_index]
    o["href"] = ARTICLE
    return o


def frame(name, x, y, z, w=0.80, h=1.09, tilt=-0.25, image_number=1, caption=None):
    before = set(bpy.data.objects)
    B.box(
        name + " cream mount",
        (x, y, z + h / 2 - (0.06 if caption else 0)),
        (w + 0.13, 0.07, h + (0.28 if caption else 0.16)),
        B.white,
        0.008,
    )
    textured(
        name + " original print",
        [
            (x - w / 2, y - 0.04, z),
            (x + w / 2, y - 0.04, z),
            (x + w / 2, y - 0.04, z + h),
            (x - w / 2, y - 0.04, z + h),
        ],
        [(0, 0), (1, 0), (1, 1), (0, 1)],
        image_number,
    )
    if caption:
        B.text(
            name + " caption",
            caption,
            (x, y - 0.045, z - 0.13),
            0.09,
            B.sans,
            rotation=(math.pi / 2, 0, 0),
            align="CENTER",
        )
    root = bpy.data.objects.new(name + " folded hinge", None)
    bpy.context.collection.objects.link(root)
    root.location = (x, y, z)
    bpy.context.view_layer.update()
    for o in set(bpy.data.objects) - before - {root}:
        world = o.matrix_world.copy()
        o.parent = root
        o.matrix_world = world
    root.rotation_euler.x = tilt
    return root


# Open coral photo tray with five independently mounted proofs.
B.box("Photo tray floor", (-3.32, -0.94, 0.65), (2.08, 1.58, 0.10), B.coral)
for x in [-4.33, -2.31]:
    B.box("Tray folded side", (x, -0.94, 0.88), (0.08, 1.58, 0.48), B.coral)
B.box("Tray rear", (-3.32, -0.19, 0.92), (2.08, 0.08, 0.54), B.coral)
B.box("Tray front", (-3.32, -1.70, 0.84), (2.08, 0.08, 0.36), B.coral)
for i, image_number in enumerate([8, 2, 3, 4, 5]):
    image = photos[image_number].node_tree.nodes.get("Image Texture").image
    frame(
        "Tray proof " + str(i),
        -3.65 + i * 0.15,
        -1.35 + i * 0.23,
        0.75,
        0.82,
        0.82 * image.size[1] / image.size[0],
        -0.16 - i * 0.025,
        image_number,
    )
# Accordion feed crossing the gutter, alternating photograph mounts and printed rules.
for i in range(9):
    x = -2.10 + i * 0.39
    y = -0.28 + i * 0.07
    z = 0.62 + (i % 2) * 0.18
    card = B.mesh(
        "Accordion proof leaf " + str(i),
        [
            (x, y, z),
            (x + 0.39, y + 0.07, 0.62 + ((i + 1) % 2) * 0.18),
            (x + 0.39, y + 0.07, 0.62 + ((i + 1) % 2) * 0.18 + 0.82),
            (x, y, z + 0.82),
        ],
        [(0, 1, 2, 3)],
        B.white,
    )
    card.modifiers.new("Card thickness", "SOLIDIFY").thickness = 0.025
    if i % 2 == 0:
        textured(
            "Accordion original photo " + str(i),
            [
                (x + 0.04, y - 0.009, z + 0.10),
                (x + 0.34, y + 0.045, z + 0.10),
                (x + 0.34, y + 0.045, z + 0.68),
                (x + 0.04, y - 0.009, z + 0.68),
            ],
            [(0, 0), (1, 0), (1, 1), (0, 1)],
            [2, 3, 4, 6, 7][i // 2],
        )
    else:
        for j in range(4):
            B.line(
                "Proof editorial rule",
                [
                    (x + 0.06, y - 0.018, z + 0.25 + j * 0.10),
                    (x + 0.28, y + 0.021, z + 0.25 + j * 0.10),
                ],
                B.muted,
                0.006,
            )
# Terminal cabinet, recessed screen, card seams, side ventilation and sloped keyboard.
B.box("Terminal foot", (2.20, -0.45, 0.67), (2.68, 1.72, 0.18), B.paper, 0.06)
B.box("Terminal cream cabinet", (2.20, 0.35, 1.62), (2.64, 0.78, 1.79), B.white, 0.09)
B.box(
    "Screen recessed dark bezel",
    (2.20, -0.057, 1.78),
    (2.28, 0.075, 1.36),
    B.blue,
    0.065,
)
B.box(
    "Cobalt phosphor screen",
    (2.20, -0.103, 1.78),
    (2.07, 0.035, 1.16),
    B.blueprint,
    0.045,
)
mono = bpy.data.fonts.load("/System/Library/Fonts/Supplemental/Courier New.ttf")
B.text(
    "Terminal first line",
    "Ideas",
    (1.39, -0.13, 1.99),
    0.18,
    mono,
    B.white,
    rotation=(math.pi / 2, 0, 0),
)
B.text(
    "Terminal second line",
    "working software.",
    (1.39, -0.13, 1.69),
    0.15,
    mono,
    B.white,
    rotation=(math.pi / 2, 0, 0),
)
B.line(
    "Screen arrow shaft", [(2.06, -0.135, 2.04), (2.40, -0.135, 2.04)], B.white, 0.009
)
B.line(
    "Screen arrow head",
    [(2.30, -0.135, 2.10), (2.40, -0.135, 2.04), (2.30, -0.135, 1.98)],
    B.white,
    0.009,
)
for j in range(3):
    B.box(
        "Side ventilation slot",
        (3.527, 0.35, 1.92 + j * 0.14),
        (0.012, 0.44, 0.055),
        B.blue,
        0.009,
    )
# Sloped deck is a wedge, keys follow its slope.
B.mesh(
    "Sloped keyboard case",
    [
        (0.82, -1.66, 0.70),
        (3.58, -1.66, 0.70),
        (3.58, -0.08, 0.70),
        (0.82, -0.08, 0.70),
        (0.82, -1.66, 0.85),
        (3.58, -1.66, 0.85),
        (3.58, -0.08, 1.15),
        (0.82, -0.08, 1.15),
    ],
    [
        (0, 3, 2, 1),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
        (4, 5, 6, 7),
    ],
    B.white,
)
for row in range(4):
    for col in range(10):
        x = 1.04 + col * 0.22
        y = -1.40 + row * 0.26
        z = 0.90 + (y + 1.40) * 0.19
        key = B.box(
            "Keyboard key",
            (x, y, z),
            (0.17, 0.19, 0.075),
            B.blueprint if col == 0 else B.white,
            0.026,
        )
        key.rotation_euler.x = 0.19
        if row < 3 and col > 0:
            B.line(
                "Key printed legend",
                [(x - 0.026, y - 0.015, z + 0.042), (x + 0.020, y - 0.015, z + 0.042)],
                B.muted,
                0.004,
            )
B.box("Cobalt spacebar", (2.18, -1.47, 0.94), (1.13, 0.16, 0.08), B.blueprint, 0.025)
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=20, ring_count=12, radius=0.10, location=(3.36, -1.19, 1.02)
)
bpy.context.object.name = "Round terminal control"
bpy.context.object.data.materials.append(B.blueprint)


# Each film loop is a real bent strip with open sprocket perforations.
# The center carries repeated full original photographs; the two edge rails have holes.
def ribbon(name, cx, cy, cz, rx, rz, width, lean, image_numbers):
    def point(t, v, offset=0):
        return (
            cx + rx * math.cos(t) + v * math.cos(lean),
            cy + v * math.sin(lean) + 0.24 * math.sin(t),
            cz + rz * math.sin(t) + offset,
        )

    steps = 180
    # Long cream rails; bridges only between sprocket holes leave physical openings.
    for side in [-1, 1]:
        for band in [
            (side * (width / 2 - 0.04), side * width / 2),
            (side * (width / 2 - 0.17), side * (width / 2 - 0.13)),
        ]:
            vs = [
                point(2 * math.pi * i / steps, v)
                for i in range(steps + 1)
                for v in band
            ]
            fs = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(steps)]
            o = B.mesh(name + " outer perforation rail", vs, fs, B.white)
            o.modifiers.new("Ribbon card thickness", "SOLIDIFY").thickness = 0.014
        for i in range(64):
            t = 2 * math.pi * i / 64
            vs = [
                point(a, v)
                for a, v in [
                    (t, side * (width / 2 - 0.13)),
                    (t, side * (width / 2 - 0.04)),
                    (t + 0.035, side * (width / 2 - 0.04)),
                    (t + 0.035, side * (width / 2 - 0.13)),
                ]
            ]
            B.mesh(name + " sprocket bridge", vs, [(0, 1, 2, 3)], B.white)
    vs = [
        point(2 * math.pi * i / steps, v)
        for i in range(steps + 1)
        for v in [-width / 2 + 0.17, width / 2 - 0.17]
    ]
    fs = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(steps)]
    strip = B.mesh(name + " cream backing", vs, fs, B.white)
    strip["href"] = ARTICLE
    strip.modifiers.new("Film backing thickness", "SOLIDIFY").thickness = 0.018
    # Six photo panels wrap the curved center, separated by cream cross bars.
    for f in range(6):
        t0 = f * math.pi / 3 + 0.045
        t1 = (f + 1) * math.pi / 3 - 0.045
        n = 24
        verts = []
        uv = []
        for i in range(n + 1):
            for j, v in enumerate([-width / 2 + 0.20, width / 2 - 0.20]):
                verts.append(point(t0 + (t1 - t0) * i / n, v, 0.012))
                uv.append((j, i / n))
        faces = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(n)]
        image_number = image_numbers[f % len(image_numbers)]
        o = B.mesh(
            name + " original film frame " + str(f), verts, faces, photos[image_number]
        )
        o["approvedImageNumber"] = image_number
        layer = o.data.uv_layers.new(name="Full original photo")
        for p in o.data.polygons:
            for idx in p.loop_indices:
                layer.data[idx].uv = uv[o.data.loops[idx].vertex_index]
        o["href"] = ARTICLE


ribbon("High film loop", 3.15, 1.32, 3.02, 0.64, 0.88, 1.42, 0.75, [4, 5])
ribbon("Middle film loop", 1.50, 1.25, 2.90, 0.62, 0.78, 1.28, 0.55, [3, 6])
ribbon("Small film loop", 0.40, 0.96, 2.36, 0.49, 0.58, 1.02, 0.55, [2, 7])
frame("Resolved output photograph", 4.12, -0.84, 0.64, 0.85, 0.85 * 795 / 585, -0.20)
# Wider proof cards preserve the full explanatory figures, with attached credits.
frame(
    "Content style output proof",
    -0.85,
    -1.36,
    0.70,
    1.30,
    1.30 * 912 / 897,
    -0.38,
    9,
    "Content + style = output",
)
frame(
    "Referenced activation atlas",
    2.95,
    -2.12,
    0.70,
    1.50,
    1.50 * 867 / 1228,
    -0.40,
    10,
    "Activation atlas · Distill",
)
B.box("Style transfer placard", (2.93, 0.18, 2.68), (1.57, 0.06, 0.32), B.white, 0.014)
B.text(
    "Style transfer label",
    "Fast style transfer",
    (2.93, 0.141, 2.61),
    0.135,
    B.font,
    rotation=(math.pi / 2, 0, 0),
    align="CENTER",
)["href"] = ARTICLE
B.studio_and_export(OUT, "start", camera_location=(0.12, -14, 13.6), camera_lens=51)
