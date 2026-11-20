"""Prepare the existing editable Start source; never overwrite its baseline.
Run: blender --background --python tool/assets/prepare_start_webgl.py
"""

import json
import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "research/models/start/webgl"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "research/models/start/start.blend"))
scene = bpy.context.scene
bpy.context.preferences.filepaths.save_version = 0
# Surface-only tangent-space bake. No illumination or occlusion is baked.
source = bpy.data.materials["Folded cream card"]
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 20))
plane = bpy.context.object
plane.name = "Temporary surface bake plane"
plane.data.materials.append(source)
normal = bpy.data.images.new("Paper fiber tangent normal", 512, 512)
normal.colorspace_settings.name = "Non-Color"
node = source.node_tree.nodes.new("ShaderNodeTexImage")
node.image = normal
source.node_tree.nodes.active = node
scene.render.engine = "CYCLES"
scene.cycles.samples = 8
scene.render.bake.use_selected_to_active = False
scene.render.bake.margin = 8
bpy.ops.object.bake(type="NORMAL", normal_space="TANGENT")
normal.filepath_raw = str(OUT / "paper-normal.png")
normal.file_format = "PNG"
normal.save()
normal.pack()
source.node_tree.nodes.remove(node)
bpy.data.objects.remove(plane, do_unlink=True)
for material in bpy.data.materials:
    if not material.use_nodes:
        continue
    nodes = material.node_tree.nodes
    bump = next((n for n in nodes if n.type == "BUMP"), None)
    if bump:
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = normal
        texture.extension = "REPEAT"
        mapping = nodes.new("ShaderNodeVectorMath")
        mapping.operation = "SCALE"
        mapping.inputs[3].default_value = 5
        coords = nodes.new("ShaderNodeTexCoord")
        material.node_tree.links.new(coords.outputs["UV"], mapping.inputs[0])
        material.node_tree.links.new(
            mapping.outputs["Vector"], texture.inputs["Vector"]
        )
        mapped = nodes.new("ShaderNodeNormalMap")
        mapped.inputs["Strength"].default_value = 0.35
        material.node_tree.links.new(texture.outputs["Color"], mapped.inputs["Color"])
        material.node_tree.links.new(
            mapped.outputs["Normal"], nodes["Principled BSDF"].inputs["Normal"]
        )

removed = []
for obj in list(scene.objects):
    # Interior sheets are hidden between the reading surface and the fore-edge shell.
    if obj.name.startswith("Paper leaf ") and obj.name != "Paper leaf 29":
        removed.append(obj.name)
        bpy.data.objects.remove(obj, do_unlink=True)
    elif obj.name == "Studio floor" or obj.type in {"LIGHT", "CAMERA"}:
        bpy.data.objects.remove(obj, do_unlink=True)
# Close the visible stack behind its scored fore-edge lines; removing hidden
# leaves must not leave open gaps or a wire-like silhouette in WebGL.
for y in [-2.824, 2.824]:
    vertices = []
    for i in range(121):
        x = -5 + i / 12
        t = min(1, abs(x) / 5)
        top = (
            0.20
            + 0.30 * math.sin(math.pi * t)
            + 0.13 * t
            + max(0, y - 1.3) ** 1.3 * 0.65
        )
        vertices.extend([(x, y, top - 0.445), (x, y, top - 0.008)])
    mesh = bpy.data.meshes.new("Closed leaf stack wall")
    mesh.from_pydata(
        vertices, [], [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(120)]
    )
    mesh.update()
    wall = bpy.data.objects.new("Closed fore-edge backing", mesh)
    scene.collection.objects.link(wall)
    wall.data.materials.append(bpy.data.materials["Ivory paper with fibers"])
# Apply bevels and convert text/curves, retaining mesh metadata and object transforms.
for obj in list(scene.objects):
    if obj.type not in {"MESH", "CURVE", "FONT"}:
        continue
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    mesh_obj = bpy.context.object
    if not mesh_obj.data.uv_layers:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(island_margin=0.025)
        bpy.ops.object.mode_set(mode="OBJECT")


def parent_keep(obj, parent):
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world


def group(name):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    return obj


book = group("Book and static paper structure")
terminal = group("Terminal cabinet")
keys = group("Keyboard independently addressable keys")
accordion = group("Accordion proof sequence")
loops = {
    name: group(name + " movable group")
    for name in ["High film loop", "Middle film loop", "Small film loop"]
}
tabs = {
    name: group("Chapter " + name)
    for name in ["Start", "Services", "Work", "Writing", "About", "Contact"]
}
for index, obj in enumerate(tabs.values()):
    obj["chapterIndex"] = index
for obj in list(scene.objects):
    if obj.type != "MESH" or obj.parent:
        continue
    loop = next(
        (root for name, root in loops.items() if obj.name.startswith(name)), None
    )
    tab = next(
        (
            root
            for name, root in tabs.items()
            if obj.name in ["Chapter tab " + name, "Printed " + name]
        ),
        None,
    )
    if loop:
        parent_keep(obj, loop)
    elif tab:
        parent_keep(obj, tab)
    elif obj.name.startswith("Keyboard key") or obj.name == "Cobalt spacebar":
        parent_keep(obj, keys)
    elif obj.name.startswith("Accordion") or obj.name.startswith("Proof editorial"):
        parent_keep(obj, accordion)
    elif any(
        obj.name.startswith(prefix)
        for prefix in [
            "Terminal",
            "Screen",
            "Cobalt phosphor",
            "Side ventilation",
            "Sloped keyboard",
            "Round terminal",
            "Key printed",
            "Style transfer",
        ]
    ):
        parent_keep(obj, terminal)
    else:
        parent_keep(obj, book)
# Join only meshes with matching material, image ID and semantic parent. Keep keys
# and chapter controls separate, and never merge across different movable groups.
batches = {}
for obj in list(scene.objects):
    if obj.type != "MESH" or obj.parent in [keys, *tabs.values()]:
        continue
    material_names = tuple(m.name for m in obj.data.materials)
    identity = (
        obj.parent.name if obj.parent else "",
        material_names,
        obj.get("approvedImageNumber"),
        obj.get("href"),
    )
    batches.setdefault(identity, []).append(obj)
for identity, objects in batches.items():
    if len(objects) < 2:
        continue
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    bpy.context.object.name = identity[0] + " / " + identity[1][0]
# Export all independent groups. Blender's GLB export transforms Z-up to Y-up.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=str(OUT / "start-surface.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_extras=True,
    export_animations=False,
    export_yup=True,
)
report = {
    "removedHiddenLeaves": len(removed),
    "meshObjects": sum(o.type == "MESH" for o in scene.objects),
    "surfaceBake": "512px tangent-space paper normals only; no lighting, AO or shadows",
    "independentKeys": len(keys.children),
    "movableFilmGroups": len(loops),
    "chapterGroups": len(tabs),
}
(OUT / "preparation.json").write_text(json.dumps(report, indent=2) + "\n")
print("START_PREPARATION_COMPLETE", json.dumps(report))
