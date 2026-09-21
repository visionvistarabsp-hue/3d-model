"""
build_demo_mall.py — deterministic demo mall generator (PHASE 2).

Sources of truth (must stay in sync):
  - floor/elevation values -> data/demo/floors.ts
  - shop plan             -> data/demo/shops.ts
  - naming rules          -> docs/shop-id-convention.md

Run from the Blender MCP:
  exec(open(r".../blender/scripts/build_demo_mall.py", encoding="utf-8").read())

The layout mirrors the web placeholder (same shop ids, same x/z positions) so
selection wiring is identical between the procedural mall and the exported GLB.
"""

import bpy

# ---------------------------------------------------------------------------
# Constants (mirror data/demo/floors.ts)
# ---------------------------------------------------------------------------
HEIGHT_M = 4.2
FLOORS = [
    {"id": "G", "elev": 0.0},
    {"id": "F1", "elev": HEIGHT_M},
    {"id": "F2", "elev": 2 * HEIGHT_M},
]

# Shop plan (mirror data/demo/shops.ts PLAN). Seq runs G -> F1 -> F2.
PLAN = {
    "G": [("retail", 6), ("anchor", 1)],
    "F1": [("food_and_beverage", 5), ("services", 2)],
    "F2": [("entertainment", 2), ("office", 4)],
}

# Bay layout (mirror placeholder-mall.tsx)
BAY_X = 10.0  # shop width span
BAY_Z = 8.0   # shop depth span
GAP = 1.2
ORIGIN_X = -6.0  # first shop center x
ORIGIN_Z = -4.0  # shop row z
SLAB = (72.0, 0.3, 48.0)
ROOF = (72.0, 0.3, 48.0)

# Status -> base colour (mirror lib/theme/shop-colors.ts intent)
STATUS_COLOR = {
    "available": (0.13, 0.55, 0.35),      # emerald-600
    "reserved": (0.93, 0.62, 0.12),       # amber-500
    "leased": (0.24, 0.42, 0.68),         # steel blue
    "under_construction": (0.45, 0.37, 0.33),
}
STRUCTURE_COLOR = (0.137, 0.149, 0.184)  # ~#23262f
GROUND_COLOR = (0.075, 0.09, 0.12)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clear_scene():
    """Remove all mesh/light/camera objects and their data blocks."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block, do_unlink=True)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block, do_unlink=True)
    bpy.ops.outliner.orphans_purge(do_recursive=True)


def make_material(name, color, metalness=0.05, roughness=0.55):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metalness
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def add_box(name, size, center, material, shop_id=None):
    """Add a unit box; name the object/mesh exactly `name`; set shopId."""
    mesh = bpy.data.meshes.new(name)
    bpy.ops.object.select_all(action="DESELECT")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = center
    # Build geometry directly (avoid operators/context/active-object issues).
    import bmesh
    bm = bmesh.new()
    verts = [
        (sx * size[0] / 2, sy * size[1] / 2, sz * size[2] / 2)
        for sx, sy, sz in [(1, 1, 1), (-1, 1, 1), (-1, -1, 1), (1, -1, 1),
                           (1, 1, -1), (-1, 1, -1), (-1, -1, -1), (1, -1, -1)]
    ]
    faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 3, 7, 4),
             (1, 5, 6, 2), (0, 4, 5, 1), (3, 2, 6, 7)]
    for v in verts:
        bm.verts.new(v)
    bm.verts.ensure_lookup_table()
    for f in faces:
        bm.faces.new([bm.verts[i] for i in f])
    bm.to_mesh(mesh)
    bm.free()

    if len(obj.data.materials) == 0:
        obj.data.materials.append(material)
    if shop_id:
        obj["shopId"] = shop_id  # -> glTF userData.shopId
    return obj


def build():
    clear_scene()

    seq = 0
    scene = bpy.context.scene

    # ------------------------------------------------------------------
    # Structure + ground
    # ------------------------------------------------------------------
    for floor in FLOORS:
        slab_mat = make_material(f"mat/MALL_{floor['id']}_STRUCT", STRUCTURE_COLOR, metalness=0.15, roughness=0.8)
        add_box(f"MALL_{floor['id']}_STRUCT", SLAB, (0, floor["elev"], 0), slab_mat)

    roof_mat = make_material("mat/MALL_ROOF", STRUCTURE_COLOR, metalness=0.15, roughness=0.8)
    add_box("MALL_ROOF", ROOF, (0, FLOORS[-1]["elev"] + HEIGHT_M, 0), roof_mat)

    ground_mat = make_material("mat/SITE_GROUND", GROUND_COLOR, metalness=0.0, roughness=0.95)
    add_box("SITE_GROUND", (160, 0.1, 120), (0, -0.05, 0), ground_mat)

    # ------------------------------------------------------------------
    # Shops
    # ------------------------------------------------------------------
    for floor in FLOORS:
        elev = floor["elev"]
        col = 0
        for _cat, count in PLAN.get(floor["id"], []):
            for _i in range(count):
                seq += 1
                shop_id = f"SHOP_{floor['id']}_{seq:03d}"
                # status derived like shops.ts (per-seq rotation)
                status = ["available", "available", "reserved", "leased", "leased"][seq % 5]
                color = STATUS_COLOR.get(status, (0.5, 0.5, 0.5))
                mat_name = f"mat/{shop_id}"
                mat = make_material(mat_name, color, metalness=0.05, roughness=0.5)
                center = (ORIGIN_X + col * (BAY_X + GAP), elev + HEIGHT_M / 2, ORIGIN_Z)
                add_box(shop_id, (BAY_X, HEIGHT_M, BAY_Z), center, mat, shop_id=shop_id)
                col += 1

    # Default camera + light for reference (removed from GLB? keep — harmless)
    if "Light" not in scene.objects:
        light_data = bpy.data.lights.new("Light", type="SUN")
        light = bpy.data.objects.new("Light", light_data)
        bpy.context.collection.objects.link(light)
        light.location = (30, -30, 40)


build()

print("\n[demo-mall] built. Shops in scene:")
n_shops = 0
for o in bpy.data.objects:
    if o.name.startswith("SHOP_"):
        n_shops += 1
total = len(bpy.data.objects)
print(f"[demo-mall] shop meshes: {n_shops}; total objects: {total}")