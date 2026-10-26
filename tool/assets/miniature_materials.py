"""Reusable miniature surface library; generated maps contain no lighting."""

import math
import bpy
import numpy as np


def surface(family, size, roughness, out, tier, rng):
    """Tileable surface-only maps. No lighting or ambient occlusion is encoded."""
    y, x = np.mgrid[0:size, 0:size] / size
    noise = rng.random((size, size)) - 0.5
    if family == "cloth":
        h = 0.45 * np.sin(x * math.tau * 64) * np.cos(y * math.tau * 64) + noise * 0.08
    elif family == "wood":
        h = (
            np.sin(x * math.tau * 38 + np.sin(y * math.tau * 3) * 2) * 0.22
            + noise * 0.18
        )
    elif family == "metal":
        h = np.sin(x * math.tau * 110) * 0.025 + noise * 0.015
    elif family == "leaf":
        h = np.sin(x * math.tau * 12 + y * math.tau * 4) * 0.08 + noise * 0.09
    else:
        h = noise * 0.15 + np.sin(x * math.tau * 99 + y * math.tau * 3) * 0.035
    dx = np.roll(h, -1, 1) - np.roll(h, 1, 1)
    dy = np.roll(h, -1, 0) - np.roll(h, 1, 0)
    normal = np.stack([-dx, -dy, np.ones_like(h)], -1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    maps = {}
    for kind, rgb in [
        ("normal", normal * 0.5 + 0.5),
        (
            "roughness",
            np.repeat(np.clip(roughness + h * 0.08, 0.03, 0.97)[..., None], 3, -1),
        ),
    ]:
        image = bpy.data.images.new(f"{family}-{kind}-{tier}", size, size)
        image.colorspace_settings.name = "Non-Color"
        rgba = np.concatenate([rgb, np.ones((size, size, 1))], -1).astype(np.float32)
        image.pixels.foreach_set(rgba.ravel())
        image.filepath_raw = str(out / f"{family}-{kind}.png")
        image.file_format = "PNG"
        image.save()
        image.pack()
        maps[kind] = image
    return maps


def classify(name):
    if any(w in name for w in ["screenshot", "original map", "chart print"]):
        return "photo"
    if "Basket chains" in name:
        return "metal"
    if "Basket cobalt" in name:
        return "paint"
    if "Plastic" in name:
        return "plastic"
    if "Mulch" in name:
        return "wood"
    if "Grass" in name or "Folded leaf" in name:
        return "leaf"
    if "cloth" in name:
        return "cloth"
    if "Ivory paper" in name or "Leaf edges" in name:
        return "paper"
    return "card"


def apply_material_library(out, tier):
    rng = np.random.default_rng(181)
    families = {
        "paper": 0.83,
        "card": 0.72,
        "cloth": 0.9,
        "photo": 0.3,
        "metal": 0.28,
        "paint": 0.34,
        "plastic": 0.4,
        "wood": 0.94,
        "leaf": 0.7,
    }
    maps = {
        name: surface(
            name,
            (1024 if name in ["paper", "cloth"] else 512)
            if tier == "enhanced"
            else (512 if name in ["paper", "cloth"] else 256),
            rough,
            out,
            tier,
            rng,
        )
        for name, rough in families.items()
    }

    for material in list(bpy.data.materials):
        if not material.use_nodes:
            continue
        nodes = material.node_tree.nodes
        principled = nodes.get("Principled BSDF")
        if not principled:
            continue
        family = classify(material.name)
        material["materialId"] = family
        material["surfaceDetailOnly"] = True
        for node in list(nodes):
            if node.type in {"BUMP", "TEX_NOISE"}:
                nodes.remove(node)
        # Keep original base-colour image and authored colour, replace only surface response.
        uv = nodes.new("ShaderNodeUVMap")
        uv.uv_map = "SurfaceUV"
        normal = nodes.new("ShaderNodeTexImage")
        normal.image = maps[family]["normal"]
        rough = nodes.new("ShaderNodeTexImage")
        rough.image = maps[family]["roughness"]
        normal_map = nodes.new("ShaderNodeNormalMap")
        normal_map.uv_map = "SurfaceUV"
        normal_map.inputs["Strength"].default_value = (
            0.45 if family == "cloth" else 0.23
        )
        for texture in [normal, rough]:
            material.node_tree.links.new(uv.outputs["UV"], texture.inputs["Vector"])
        material.node_tree.links.new(
            normal.outputs["Color"], normal_map.inputs["Color"]
        )
        material.node_tree.links.new(
            normal_map.outputs["Normal"], principled.inputs["Normal"]
        )
        material.node_tree.links.new(
            rough.outputs["Color"], principled.inputs["Roughness"]
        )
        if family == "metal":
            principled.inputs["Metallic"].default_value = 1
        if family in ["paint", "plastic", "photo"]:
            principled.inputs["Coat Weight"].default_value = (
                0.18 if family != "photo" else 0.28
            )
            principled.inputs["Coat Roughness"].default_value = 0.22
