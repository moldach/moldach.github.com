"""Author the Work spread as editable geometry, render, and draft GLB.
Run: blender --background --python tool/assets/build_work.py
The app is intentionally unchanged. Original project imagery remains attributable.
"""

import sys
import math
import random
from pathlib import Path
from collections import deque

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import paper_scene as B  # noqa: E402

ROOT = B.ROOT
OUT = ROOT / "research/models/work"
B.make_book(2)
random.seed(181)
# Distinct exhibit materials.
grass = [
    B.mat("Grass paper " + str(i), c)
    for i, c in enumerate(
        [
            (0.12, 0.22, 0.035),
            (0.22, 0.36, 0.07),
            (0.31, 0.42, 0.08),
            (0.39, 0.48, 0.13),
        ]
    )
]
leaves = [
    B.mat("Folded leaf " + str(i), c)
    for i, c in enumerate(
        [(0.035, 0.10, 0.025), (0.10, 0.23, 0.035), (0.21, 0.33, 0.05)]
    )
]
mulch = [
    B.mat("Mulch chip " + str(i), c)
    for i, c in enumerate(
        [
            (0.18, 0.052, 0.018),
            (0.30, 0.10, 0.027),
            (0.42, 0.15, 0.042),
            (0.23, 0.065, 0.015),
        ]
    )
]
orange = B.mat("Plastic ground marker", (0.95, 0.18, 0.012), False)
metal = B.mat("Basket chains", (0.45, 0.48, 0.49), False)
metal.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.55
metal.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.38
basket_blue = B.mat("Basket cobalt", (0.006, 0.085, 0.29), False)
magenta = B.mat("Folded magenta", (0.62, 0.007, 0.25))
teal = B.mat("Folded teal", (0.025, 0.39, 0.35))
ochre = B.mat("Folded orange", (0.86, 0.23, 0.015))
purple = B.mat("Folded violet", (0.13, 0.035, 0.19))

# Physical title follows the rear paper surface.
heading = B.text("Work heading", "Selected work", (-4.53, 2.21, 1.1), 0.53, B.bold)
bpy.ops.object.select_all(action="DESELECT")
heading.select_set(True)
bpy.context.view_layer.objects.active = heading
bpy.ops.object.convert(target="MESH")
heading = bpy.context.object
for v in heading.data.vertices:
    v.co.z = (
        B.height(v.co.x + heading.location.x)
        + B.rear_fold(v.co.y + heading.location.y)
        + 0.028
        - heading.location.z
    )
heading.select_set(False)
B.line(
    "Printed title underline",
    [
        (-4.4, 2.03, B.height(-4.4) + B.rear_fold(2.03) + 0.04),
        (-3.75, 2.03, B.height(-3.75) + B.rear_fold(2.03) + 0.04),
    ],
    basket_blue,
    0.014,
)


def cylinder(name, loc, radius, depth, material, vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=loc
    )
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    bevel = o.modifiers.new("Cut rim", "BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    return o


def ellipse(name, cx, cy, z, rx, ry, depth, material):
    o = cylinder(name, (cx, cy, z), 1, depth, material, 96)
    o.scale = (rx, ry, 1)
    return o


def circle_points(cx, cy, z, r, count=65):
    return [
        (
            cx + r * math.cos(i * 2 * math.pi / (count - 1)),
            cy + r * math.sin(i * 2 * math.pi / (count - 1)),
            z,
        )
        for i in range(count)
    ]


# PuttPulse: putting circle, raised mulch target, individual chips and marker whiskers.
cx, cy = -3.20, -0.10
ellipse("Putting green cream paper base", cx, cy, 0.61, 1.69, 1.45, 0.13, B.white)
ellipse("Putting green layered grass", cx, cy, 0.71, 1.60, 1.37, 0.10, grass[1])
ellipse("Raised mulch bed", cx, cy + 0.16, 0.83, 0.96, 0.82, 0.16, mulch[0])
for i in range(350):
    angle = random.random() * math.tau
    r = math.sqrt(random.random())
    x = cx + math.cos(angle) * r * 0.93
    y = cy + 0.16 + math.sin(angle) * r * 0.79
    chip = B.box(
        "Mulch chip",
        (x, y, 0.915 + random.random() * 0.035),
        (0.055 + random.random() * 0.08, 0.025 + random.random() * 0.025, 0.022),
        random.choice(mulch),
        0.004,
    )
    chip.rotation_euler = (
        random.uniform(-0.15, 0.15),
        random.uniform(-0.12, 0.12),
        random.random() * math.tau,
    )
for i in range(230):
    angle = random.random() * math.tau
    r = math.sqrt(random.random())
    x = cx + math.cos(angle) * r * 1.56
    y = cy + math.sin(angle) * r * 1.33
    if ((x - cx) / 1.02) ** 2 + ((y - cy - 0.16) / 0.90) ** 2 < 1:
        continue
    z = 0.77
    h = random.uniform(0.035, 0.12)
    B.mesh(
        "Short paper grass blade",
        [(x - 0.02, y, z), (x + 0.02, y, z), (x + 0.01, y + 0.02, z + h)],
        [(0, 1, 2)],
        random.choice(grass),
    )
for i in range(12):
    a = i * math.tau / 12
    x = cx + math.cos(a) * 1.25
    y = cy + math.sin(a) * 1.07
    for j in range(5):
        B.line(
            "Orange marker whisker",
            [
                (x, y, 0.76),
                (
                    x + random.uniform(-0.045, 0.045),
                    y + random.uniform(-0.04, 0.04),
                    0.92 + random.random() * 0.035,
                ),
            ],
            orange,
            0.008,
        )
# Only a disc, no tee pad.
cylinder("Putting disc", (cx - 0.93, cy - 0.72, 0.81), 0.24, 0.035, basket_blue)
cylinder("Disc embossed center", (cx - 0.93, cy - 0.72, 0.831), 0.12, 0.005, B.white)
# Detailed basket: pole, blue band, hanging chains and open wire cage.
bx, by = cx, cy + 0.20
cylinder("Basket pole", (bx, by, 1.55), 0.027, 1.44, metal, 20)
cylinder("Basket blue top band", (bx, by, 2.36), 0.34, 0.095, basket_blue)
for i in range(16):
    a = i * math.tau / 16
    chain = []
    for j in range(14):
        t = j / 13
        r = 0.29 * (1 - t) + 0.09 * t + 0.055 * math.sin(t * math.pi)
        chain.append((bx + r * math.cos(a), by + r * math.sin(a), 2.30 - t * 0.75))
    B.line("Hanging basket chain", chain, metal, 0.011)
for z, r in [(1.41, 0.35), (1.62, 0.42)]:
    B.line("Basket cage rim", circle_points(bx, by, z, r), basket_blue, 0.017)
for i in range(16):
    a = i * math.tau / 16
    B.line(
        "Open basket cage wire",
        [
            (bx + 0.35 * math.cos(a), by + 0.35 * math.sin(a), 1.41),
            (bx + 0.42 * math.cos(a), by + 0.42 * math.sin(a), 1.62),
        ],
        basket_blue,
        0.011,
    )
for i in range(13):
    a = i * math.tau / 13 + 0.12
    x = cx + math.cos(a) * 1.58
    y = cy + math.sin(a) * 1.33
    for j in range(3):
        angle = a + j * 0.7
        h = 0.20 + random.random() * 0.20
        w = 0.065
        B.mesh(
            "Folded course foliage",
            [
                (x - w, y, 0.76),
                (x + w, y, 0.76),
                (x + math.cos(angle) * 0.15, y + math.sin(angle) * 0.15, 0.76 + h),
                (x, y + 0.035, 0.76 + h * 0.5),
            ],
            [(0, 1, 3), (1, 2, 3), (2, 0, 3)],
            random.choice(leaves),
        )

# Original Shiny-filteRs screen, inset in a separate cream device shell.
phone = B.box(
    "Shiny-filteRs phone shell", (-0.15, 0.38, 2.05), (1.68, 0.18, 3.22), B.white, 0.13
)
phone["href"] = "/work/#shiny-filters"
B.box("Phone dark bezel", (-0.15, 0.278, 2.05), (1.54, 0.035, 3.08), B.ink, 0.095)
image = bpy.data.images.load(str(ROOT / "project/shiny-filters/featured.jpg"))
image.pack()
screen_mat = bpy.data.materials.new("Original Shiny-filteRs screenshot")
screen_mat.use_nodes = True
nodes = screen_mat.node_tree.nodes
p = nodes.get("Principled BSDF")
tex = nodes.new("ShaderNodeTexImage")
tex.image = image
screen_mat.node_tree.links.new(tex.outputs["Color"], p.inputs["Base Color"])
p.inputs["Roughness"].default_value = 0.75
screen = B.mesh(
    "Original application screen",
    [
        (-0.86, 0.254, 0.59),
        (0.56, 0.254, 0.59),
        (0.56, 0.254, 3.51),
        (-0.86, 0.254, 3.51),
    ],
    [(0, 1, 2, 3)],
    screen_mat,
)
uv = screen.data.uv_layers.new()
coords = [(0, 0.065), (1, 0.065), (1, 0.89), (0, 0.89)]
for polygon in screen.data.polygons:
    for index in polygon.loop_indices:
        uv.data[index].uv = coords[screen.data.loops[index].vertex_index]
B.box("Phone notch", (-0.15, 0.227, 3.49), (0.55, 0.045, 0.10), B.ink, 0.035)
B.box("Phone earpiece", (-0.15, 0.200, 3.50), (0.25, 0.015, 0.018), metal, 0.006)
B.box("Phone cradle", (-0.15, 0.15, 0.49), (2.05, 0.88, 0.17), B.white, 0.015)
for x in [-1.03, 0.73]:
    B.mesh(
        "Folded device support",
        [(x, -0.34, 0.46), (x, 0.48, 0.46), (x, 0.48, 0.99), (x, 0.32, 1.04)],
        [(0, 1, 2, 3)],
        B.paper,
    )
# Colorful folded facets fan behind the device, each a real paper triangle.
for i in range(13):
    a = -0.2 + i * 0.27
    r = 1.12 + random.random() * 0.25
    x = -0.15 + math.cos(a) * r
    z = 1.85 + math.sin(a) * 1.8
    y = 0.72 + random.random() * 0.20
    color = [magenta, purple, teal, ochre, basket_blue][i % 5]
    points = [
        (-0.15, 0.81, 1.27),
        (x - 0.3, y, z - 0.25),
        (x + 0.25, y + 0.10, z + 0.32),
        (x + 0.03, y - 0.2, z - 0.04),
    ]
    obj = B.mesh("Folded filter fan", points, [(0, 1, 3), (1, 2, 3), (2, 0, 3)], color)
    obj.modifiers.new("Paper fan thickness", "SOLIDIFY").thickness = 0.025

# Hinuhinu island outlines extracted from the original flat map's colored regions.
# Raised contour stacks are illustrative geometry, not DEM elevations.
source = bpy.data.images.load(str(ROOT / "project/hinuhinu/featured.png"))
source.pack()
w, h = source.size
pixels = np.asarray(source.pixels[:], dtype=float).reshape(h, w, 4)[::-1, :, :3]


def outline(crop):
    x0, y0, x1, y1 = [int(v) for v in crop]
    rgb = pixels[y0:y1, x0:x1]
    mask = (rgb.min(axis=2) < 0.90) & ((rgb.max(axis=2) - rgb.min(axis=2)) > 0.025)
    seen = set()
    largest = set()
    hh, ww = mask.shape
    for yy, xx in zip(*np.nonzero(mask)):
        if (int(xx), int(yy)) in seen:
            continue
        component = set()
        q = deque([(int(xx), int(yy))])
        seen.add((int(xx), int(yy)))
        while q:
            x, y = q.popleft()
            component.add((x, y))
            for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                if (
                    0 <= nx < ww
                    and 0 <= ny < hh
                    and mask[ny, nx]
                    and (nx, ny) not in seen
                ):
                    seen.add((nx, ny))
                    q.append((nx, ny))
        if len(component) > len(largest):
            largest = component
    assert len(largest) > 1000, "No reliable island silhouette"
    edges = {}
    for x, y in largest:
        for neighbor, a, b in [
            ((x, y - 1), (x, y), (x + 1, y)),
            ((x + 1, y), (x + 1, y), (x + 1, y + 1)),
            ((x, y + 1), (x + 1, y + 1), (x, y + 1)),
            ((x - 1, y), (x, y + 1), (x, y)),
        ]:
            if neighbor not in largest:
                edges.setdefault(a, []).append(b)
    loops = []
    while edges:
        start = next(iter(edges))
        current = start
        previous = None
        loop = []
        while current in edges:
            loop.append(current)
            options = edges[current]
            if previous is None:
                target = options[0]
            else:
                dx, dy = current[0] - previous[0], current[1] - previous[1]

                def priority(point):
                    ex, ey = point[0] - current[0], point[1] - current[1]
                    cross = dx * ey - dy * ex
                    dot = dx * ex + dy * ey
                    return 3 if cross > 0 else 2 if dot > 0 else 1 if cross < 0 else 0

                target = max(options, key=priority)
            options.remove(target)
            if not options:
                del edges[current]
            previous, current = current, target
            if current == start:
                break
        if current == start:
            loops.append(loop)

    def area(path):
        return abs(
            sum(
                path[i][0] * path[(i + 1) % len(path)][1]
                - path[(i + 1) % len(path)][0] * path[i][1]
                for i in range(len(path))
            )
        )

    assert loops, "No closed source contour"
    path = max(loops, key=area)
    # Uniform sampling retains the actual outline while bounding geometry size.
    path = path[:: max(1, len(path) // 100)]
    return [((x + x0) / w, (y + y0) / h) for x, y in path]


def slab(name, points, z, depth, material):
    verts = [(x, y, z + zz) for zz in [0, depth] for x, y in points]
    n = len(points)
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [
        (i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)
    ]
    o = B.mesh(name, verts, faces, material)
    bevel = o.modifiers.new("Soft cut paper edge", "BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    return o


water = [
    B.mat("Ocean paper " + str(i), c)
    for i, c in enumerate(
        [
            (0.012, 0.40, 0.48),
            (0.045, 0.63, 0.66),
            (0.22, 0.80, 0.79),
            (0.53, 0.90, 0.84),
        ]
    )
]
for layer in range(4):
    scale = 1 - layer * 0.09
    points = []
    for i in range(96):
        a = i * math.tau / 96
        r = 1 + 0.09 * math.sin(a * 5) + 0.04 * math.cos(a * 9)
        points.append(
            (
                3.05 + math.cos(a) * 2.04 * scale * r,
                0.06 + math.sin(a) * 1.48 * scale * r,
            )
        )
    slab("Layered ocean contour", points, 0.45 + layer * 0.055, 0.052, water[layer])
terrain = [
    B.mat("Maui terrain " + str(i), c)
    for i, c in enumerate(
        [(0.10, 0.27, 0.18), (0.20, 0.43, 0.29), (0.40, 0.59, 0.37), (0.66, 0.75, 0.49)]
    )
]
altitude = [
    B.mat("Hawaii altitude " + str(i), c)
    for i, c in enumerate(
        [(0.61, 0.25, 0.16), (0.78, 0.40, 0.27), (0.89, 0.62, 0.38), (0.94, 0.76, 0.52)]
    )
]


def island(name, crop, cx, cy, scale, colors):
    contour = outline(crop)
    mx = sum(x for x, y in contour) / len(contour)
    my = sum(y for x, y in contour) / len(contour)
    assert max(x for x, y in contour) - min(x for x, y in contour) > 0.12, (
        name + " silhouette is too narrow"
    )
    points = [
        (cx + (x - mx) * scale, cy - (y - my) * scale * h / w) for x, y in contour
    ]
    for i in range(5):
        factor = 1 - i * 0.065
        layer = [(cx + (x - cx) * factor, cy + (y - cy) * factor) for x, y in points]
        slab(
            name + " contour " + str(i),
            layer,
            0.70 + i * 0.063,
            0.061,
            colors[min(i, len(colors) - 1)],
        )
    # Top face follows original map pixels; UVs carry the original chart, not fake measurements.
    material = bpy.data.materials.new(name + " original map")
    material.use_nodes = True
    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = source
    material.node_tree.links.new(
        node.outputs["Color"],
        material.node_tree.nodes.get("Principled BSDF").inputs["Base Color"],
    )
    top = [(cx + (x - cx) * 0.73, cy + (y - cy) * 0.73, 1.021) for x, y in points]
    surface = B.mesh(name + " printed map", top, [tuple(range(len(top)))], material)
    uv = surface.data.uv_layers.new()
    for polygon in surface.data.polygons:
        for index in polygon.loop_indices:
            vertex = surface.data.loops[index].vertex_index
            x, y = contour[vertex]
            uv.data[index].uv = (x, 1 - y)
    surface["href"] = "/work/#hinuhinu"


island("Maui", (0, 0.12 * h, 0.335 * w, 0.84 * h), 2.55, 0.48, 6.2, terrain)
island("Hawaii", (0.34 * w, 0.10 * h, 0.63 * w, 0.88 * h), 3.94, -0.34, 5.4, altitude)
# A standing original altitude chart behind the stacked terrain.
chart = B.box(
    "Standing Hinuhinu chart", (3.87, 1.65, 1.74), (1.33, 0.04, 1.63), B.white, 0.008
)
chartmat = bpy.data.materials.new("Original Hinuhinu chart print")
chartmat.use_nodes = True
node = chartmat.node_tree.nodes.new("ShaderNodeTexImage")
node.image = source
chartmat.node_tree.links.new(
    node.outputs["Color"],
    chartmat.node_tree.nodes.get("Principled BSDF").inputs["Base Color"],
)
face = B.mesh(
    "Altitude chart image",
    [
        (3.26, 1.624, 0.99),
        (4.48, 1.624, 0.99),
        (4.48, 1.624, 2.49),
        (3.26, 1.624, 2.49),
    ],
    [(0, 1, 2, 3)],
    chartmat,
)
uv = face.data.uv_layers.new()
coords = [(0.34, 0.10), (0.63, 0.10), (0.63, 0.90), (0.34, 0.90)]
for polygon in face.data.polygons:
    for index in polygon.loop_indices:
        uv.data[index].uv = coords[face.data.loops[index].vertex_index]
# Physical project nameplates; actual hyperlinks survive export as extras.
for x, label, href in [
    (-3.2, "PuttPulse", "/work/#puttpulse"),
    (-0.15, "Shiny-filteRs", "/work/#shiny-filters"),
    (3.30, "Hinuhinu", "/work/#hinuhinu"),
]:
    plate = B.box(
        "Project nameplate " + label,
        (x, -1.64, 0.60),
        (1.90, 0.42, 0.055),
        B.white,
        0.012,
    )
    plate.rotation_euler.x = math.radians(35)
    plate["href"] = href
    label_obj = B.text(
        "Project label " + label, label, (x, -1.77, 0.60), 0.23, B.font, align="CENTER"
    )
    label_obj.rotation_euler.x = math.radians(35)
    B.line(
        "Project placard underline",
        [(x - 0.16, -1.83, 0.575), (x + 0.16, -1.83, 0.575)],
        basket_blue,
        0.01,
    )
B.studio_and_export(OUT, "work")
