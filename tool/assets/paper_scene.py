"""Shared paper-scene helpers for Blender chapter asset authoring.
Import from a chapter builder in a fresh background Blender process.
All geometry is authored here. Reference illustration is not projected on meshes.
"""

import bpy
import math
import random
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
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


def make_book(active_chapter):
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
    for i, label in enumerate(
        ["Start", "Services", "Work", "Writing", "About", "Contact"]
    ):
        x = -3.9 + i * 1.53
        tab = box(
            "Chapter tab " + label,
            (x, -3.02, -0.06),
            (1.19, 0.50, 0.055),
            blue if i == active_chapter else white,
            0.032,
        )
        tab["chapterIndex"] = i
        text(
            "Printed " + label,
            label,
            (x, -3.08, -0.027),
            0.18,
            sans,
            white if i == active_chapter else ink,
            align="CENTER",
        )


def studio_and_export(out, slug, camera_location=(0.12, -12, 15), camera_lens=57):
    out.mkdir(parents=True, exist_ok=True)
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
    bpy.ops.object.camera_add(location=camera_location)
    cam = bpy.context.object
    cam.name = "Reference camera"
    cam.rotation_euler = (
        (Vector((0, 0, 0.7)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    )
    cam.data.lens = camera_lens
    scene.camera = cam
    # Persist editable source. System fonts stay external; export converts text to geometry.
    bpy.ops.wm.save_as_mainfile(filepath=str(out / (slug + ".blend")))
    scene.render.filepath = str(out / (slug + "-render.png"))
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
        filepath=str(out / (slug + "-geometry.glb")),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=True,
        export_animations=False,
    )
    print("CHAPTER_ASSET_COMPLETE", str(out))
