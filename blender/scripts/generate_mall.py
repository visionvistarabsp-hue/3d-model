import sys, os, json
_D = os.path.dirname(os.path.abspath(__file__))
if _D not in sys.path:
    sys.path.insert(0, _D)
import bpy
import mall_lib as L

# Build the whole mall. Requires nothing pre-existing in the scene.
L.clear_scene()
L.ensure_materials()

col_mall = L.get_collection("MALL")

import generate_structure as GSTRUCT
import generate_shops as GSHOPS
import generate_common_area as GCOMMON

GSTRUCT.build_facade()
GSTRUCT.build_structure()
GSHOPS.build_shops()
GCOMMON.build_common_area()
GCOMMON.build_lifts()
GCOMMON.build_stairs()
GCOMMON.build_toilets()
GCOMMON.build_planters()

# dev cameras + lights (exported GLB excludes these)
col_cam = L.get_collection("CAMERAS", parent=col_mall)
L.make_camera("CAMERA_HERO", (18, -20, 10), (0, 0, 2.5), col_cam)
L.make_camera("CAMERA_FRONT", (0, 26, 6), (0, 0, 6), col_cam, lens=35.0)
L.make_camera("CAMERA_ATRIUM", (0, 20, 16), (0, 5, 0), col_cam)
L.make_camera("CAMERA_ENTRANCE", (-10, 16, 3), (-3, 13, 1), col_cam, lens=24.0)

col_light = L.get_collection("LIGHTS", parent=col_mall)
sun1 = bpy.data.objects.new("SUN_MAIN", bpy.data.lights.new("SUN_MAIN", "SUN"))
sun1.rotation_euler = (0.785398, 0, 0.523599)
sun1.data.energy = 8
L.link_obj(sun1, col_light)
sun2 = bpy.data.objects.new("SUN_FILL", bpy.data.lights.new("SUN_FILL", "SUN"))
sun2.rotation_euler = (-0.785398, 0, -0.785398)
sun2.data.energy = 2.5
L.link_obj(sun2, col_light)

# --- validation output (parsed by the agent) ---
shops = []
mats = L.ensure_materials()
for obj in bpy.data.objects:
    if obj.name.startswith("SHOP_") and "_" in obj.name[5:]:
        parts = obj.name[5:].split("_")
        if len(parts) == 2:  # pure SHOP_<F>_<SEQ> shell (parts have >2)
            shops.append(obj)

info = {
    "object_count": len(bpy.data.objects),
    "shop_shells": len(shops),
    "shop_names": sorted(o.name for o in shops),
    "collections": [c.name for c in bpy.data.collections],
    "materials": [m.name for m in bpy.data.materials],
}
print("MALL_JSON_START")
print(json.dumps(info, indent=2))
print("MALL_JSON_END")