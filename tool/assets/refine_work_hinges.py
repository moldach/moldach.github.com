"""Physical hinge clearance and optical clarity, shared by authoring and refinements."""

import math
import bpy


def refine():
    glass = bpy.data.materials.get("Optical glass")
    if glass:
        glass.node_tree.nodes["Principled BSDF"].inputs[
            "Roughness"
        ].default_value = 0.012
    content = next(
        o for o in bpy.context.scene.objects if o.get("role") == "chapter-content"
    )
    for rig_id, height in [("puttpulse-basket", 1.40), ("hinuhinu-chart", 1.60)]:
        rig = next(o for o in bpy.context.scene.objects if o.get("rigId") == rig_id)
        matrices = [(o, o.matrix_world.copy()) for o in rig.children]
        rig.location.z = height
        bpy.context.view_layer.update()
        for o, matrix in matrices:
            o.matrix_world = matrix
        # Fixed bearing connects each elevated hinge to the mounting surface.
        name = rig_id + " fixed bearing"
        if bpy.data.objects.get(name):
            continue
        base = 0.92 if rig_id == "puttpulse-basket" else 0.95
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=20,
            radius=0.038,
            depth=height - base,
            location=(rig.location.x, rig.location.y, (height + base) / 2),
        )
        support = bpy.context.object
        support.name = name
        support.data.materials.append(bpy.data.materials["Basket chains"])
        support.parent = content
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=20,
            radius=0.055,
            depth=0.12,
            location=rig.location,
            rotation=(0, math.pi / 2, 0),
        )
        bearing = bpy.context.object
        bearing.name = name + " axle"
        bearing.data.materials.append(bpy.data.materials["Basket chains"])
        bearing.parent = content
