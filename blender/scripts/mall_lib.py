import bpy
import math
from math import atan2, sqrt

MALL_CONFIG = {
    "name": "Acropolis Mall (Parametric Demo)",
    "floors": ["G", "F1", "F2"],
    "floor_height": 4.2,
    "slab_thickness": 0.30,
    "shop_columns": 3,
    "shop_rows": 3,
    "shop_width": 5.0,
    "shop_depth": 5.0,
    "wall_thickness": 0.20,
    "corridor_width": 3.0,
    "column_radius": 0.32,
    "atrium_x": [-3.3, 3.3],
    "atrium_y": [11.4, 13.6],
}


def cfg():
    return MALL_CONFIG


def col_pitch():
    return MALL_CONFIG["shop_width"] + MALL_CONFIG["wall_thickness"]


def col_x(col):
    return (col - 1) * col_pitch()


def row_y(row):
    if row == 1:
        return 8.5
    if row == 2:
        return 0.5
    return -7.5


def z_base(floor_idx):
    return floor_idx * MALL_CONFIG["floor_height"]


def row_front_y(row):
    if row == 1:
        return 11.0
    if row == 2:
        return 3.0
    return -5.0


def build_y():
    return -14.0


def front_y():
    return 14.2


def side_x():
    return 7.9


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for col in list(bpy.data.collections):
        if col.users == 0:
            bpy.data.collections.remove(col)
    for mat in list(bpy.data.materials):
        if mat.users == 0:
            bpy.data.materials.remove(mat)


def get_collection(name, parent=None):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
    if parent is not None and col.name not in parent.children:
        parent.children.link(col)
    if col.name not in bpy.context.scene.collection.children and parent is None:
        bpy.context.scene.collection.children.link(col)
    return col


def link_obj(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def ensure_materials():
    mats = {}

    def _make(name, color, **kwargs):
        mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
        mat.use_nodes = True
        nt = mat.node_tree
        out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None)
        if out is None:
            out = nt.nodes.new("ShaderNodeOutputMaterial")
        for node in list(nt.nodes):
            if node.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
                nt.nodes.remove(node)
        bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1.0)
        bsdf.inputs["Roughness"].default_value = kwargs.get("roughness", 0.7)
        bsdf.inputs["Metallic"].default_value = kwargs.get("metallic", 0.0)
        if "ior" in kwargs:
            bsdf.inputs["IOR"].default_value = kwargs["ior"]
        if "transmission" in kwargs:
            bsdf.inputs["Transmission"].default_value = kwargs["transmission"]
        if "alpha" in kwargs:
            bsdf.inputs["Alpha"].default_value = kwargs["alpha"]
        if "emissive_color" in kwargs or "emissive" in kwargs:
            nt.nodes.new("ShaderNodeEmission")
        blend = kwargs.get("blend", None)
        if blend:
            mat.blend_method = blend
        if kwargs.get("no_shadow"):
            try:
                mat.shadow_method = "NONE"
            except AttributeError:
                pass
        mats[name] = mat
        return mat

    _make("MAT_CONCRETE", (0.81, 0.79, 0.76), roughness=0.9)
    _make("MAT_WALL", (0.95, 0.94, 0.91), roughness=0.85)
    _make("MAT_WALL_DARK", (0.55, 0.58, 0.62), roughness=0.8)
    _make("MAT_FLOOR", (0.93, 0.92, 0.89), roughness=0.22, metallic=0.02)
    _make("MAT_GLASS", (0.62, 0.76, 0.86), roughness=0.05, ior=1.45, alpha=0.28, blend="BLEND", no_shadow=True)
    _make("MAT_FRAME", (0.18, 0.19, 0.21), roughness=0.5, metallic=0.7)
    _make("MAT_SIGN", (0.16, 0.19, 0.24), roughness=0.55)
    _make("MAT_METAL", (0.72, 0.75, 0.79), roughness=0.35, metallic=0.85)
    _make("MAT_CHROME", (0.85, 0.87, 0.9), roughness=0.12, metallic=1.0, ior=1.2)
    _make("MAT_STEP", (0.28, 0.3, 0.33), roughness=0.9)
    _make("MAT_ROOF", (0.4, 0.43, 0.48), roughness=0.9)
    _make("MAT_STONE", (0.62, 0.58, 0.52), roughness=0.85)
    _make("MAT_TILE_WHITE", (0.94, 0.95, 0.96), roughness=0.4)
    _make("MAT_FIXTURE", (0.96, 0.97, 0.97), roughness=0.5)
    _make("MAT_WOOD", (0.55, 0.42, 0.33), roughness=0.6)
    _make("MAT_CARPET", (0.32, 0.26, 0.24), roughness=0.95)
    return mats


def add_box(name, center, size, mat, col=None, props=None):
    bpy.ops.mesh.primitive_cube_add(size=2.0, location=center)
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    o.scale = (size[0] / 2.0, size[1] / 2.0, size[2] / 2.0)
    if mat is not None:
        o.data.materials.clear()
        o.data.materials.append(mat)
    if col is not None:
        link_obj(o, col)
    if props:
        for k, v in props.items():
            o[k] = v
    return o


def add_cylinder(name, center, radius, height, mat, col=None, verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=2.0, location=center)
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    o.scale = (1.0, 1.0, height / 2.0)
    if mat is not None:
        o.data.materials.clear()
        o.data.materials.append(mat)
    if col is not None:
        link_obj(o, col)
    return o


def add_tilted(name, start, end, width, thickness, mat, col=None, y=None, props=None):
    sx, sy, sz = start
    ex, ey, ez = end
    dx, dz = ex - sx, ez - sz
    length = sqrt(dx * dx + dz * dz)
    mid = ((sx + ex) / 2.0, (sy + ey) / 2.0 if y is None else y, (sz + ez) / 2.0)
    o = add_box(name, mid, (length, width if width else 0.05, thickness), mat, col=col)
    o.rotation_euler = (0.0, -atan2(dz, dx), 0.0)
    if props:
        for k, v in props.items():
            o[k] = v
    return o


def set_active(s):
    for o in bpy.data.objects:
        o.select_set(o.name in s)
    bpy.context.view_layer.objects.active = bpy.data.objects.get(next(iter(s))) if s else None


def join_objects(obj_names, new_name, col=None):
    objs = [bpy.data.objects[n] for n in obj_names if n in bpy.data.objects]
    if not objs:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    jo = bpy.context.active_object
    jo.name = new_name
    jo.data.name = new_name
    if col is not None:
        link_obj(jo, col)
    return jo


def prop(obj, props):
    for k, v in props.items():
        obj[k] = v
    return obj


def make_camera(name, location, target, col, lens=50.0):
    cam_data = bpy.data.cameras.new(name)
    cam = bpy.data.objects.new(name, cam_data)
    cam.location = location
    cam.rotation_euler = (0, 0, 0)
    cam_data.lens = lens
    from mathutils import Vector

    direction = Vector(target) - Vector(location)
    q = Vector((0, 0, -1)).rotation_difference(direction.normalized())
    cam.rotation_euler = q.to_euler()
    link_obj(cam, col)
    return cam