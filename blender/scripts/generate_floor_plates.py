import sys, os
_D = os.path.dirname(os.path.abspath(__file__))
if _D not in sys.path:
    sys.path.insert(0, _D)
import bpy
import mall_lib as L
import generate_shops as SH
import generate_common_area as CA
import generate_structure as ST

# One open "sheet" per floor, slab-top normalised to z = 0 so the same
# per-floor camera framing works for every plate. Contains that floor's
# shops + common-area plan (toilets, lifts, stairs, planters) and, where the
# real building has them, the escalator segment that DEPARTS this level.
PLATES = [
    ("PLATE_G", "G", 0),
    ("PLATE_F1", "F1", 1),
    ("PLATE_F2", "F2", 2),
]

ATRIUM_X = L.cfg()["atrium_x"]
ATRIUM_Y = L.cfg()["atrium_y"]

# slab footprint (mirrors generate_structure.FOOT_*)
SLAB_X = (ST.FOOT_X0, ST.FOOT_X1, ST.FOOT_X1 - ST.FOOT_X0)
SLAB_Y = (ST.FOOT_Y0, ST.FOOT_Y1, ST.FOOT_Y1 - ST.FOOT_Y0)


def build_plates():
    L.clear_scene()
    MATS = L.ensure_materials()
    CA.MATS = MATS
    col_mall = L.get_collection("MALL")
    col_plates = L.get_collection("PLATES", parent=col_mall)
    cols = {}
    for tag, fl, fi in PLATES:
        cols[tag] = L.get_collection(tag, parent=col_plates)

    build_plate_g(cols["PLATE_G"])
    build_plate_upper(cols["PLATE_F1"], "F1", 1, escalators=True)
    build_plate_upper(cols["PLATE_F2"], "F2", 2, escalators=False)
    return cols


def build_plate_g(col):
    MATS = L.ensure_materials()
    CA.MATS = MATS
    z0 = 0.0
    L.add_box("PLATE_G_SLAB", ((SLAB_X[0] + SLAB_X[1]) / 2.0, (SLAB_Y[0] + SLAB_Y[1]) / 2.0, z0 - ST.SLAB_T / 2.0), (SLAB_X[2], SLAB_Y[2], ST.SLAB_T), MATS["MAT_WALL"], col=col)
    L.add_box("PLATE_G_PLAZA", (0.0, 15.2, z0 + 0.05), (6.4, 3.2, 0.1), MATS["MAT_STONE"], col=col)
    SH.build_floor(0, z_base=z0, col_floor=col)
    plate_openrooms(col, z0, "G")
    plate_lifts(col, z0, "G")
    plate_stairs(col, z0, "G")
    for tag, yoff in (("A", -0.4), ("B", 0.4)):
        CA.build_escalator(f"PLATE_G_ESC_{tag}", -3.5, 4.0, 12.3 + yoff, z0 + 0.05, col)
    plate_planters(col, z0, "G")


def build_plate_upper(col, fl, fi, escalators):
    MATS = L.ensure_materials()
    CA.MATS = MATS
    z0 = 0.0
    for i, (x, y, z, sx, sy, sz) in enumerate(ST.atrium_slab_boxes(z0 - ST.SLAB_T / 2.0, ST.FOOT_Y0, ST.FOOT_Y1), start=1):
        L.add_box(f"PLATE_{fl}_SLAB_{i}", (x, y, z), (sx, sy, sz), MATS["MAT_WALL"], col=col)
    SH.build_floor(fi, z_base=z0, col_floor=col)
    plate_atrium(col, z0, fl)
    plate_openrooms(col, z0, fl)
    plate_lifts(col, z0, fl)
    plate_stairs(col, z0, fl)
    if escalators:
        for tag, yoff in (("A", -0.4), ("B", 0.4)):
            CA.build_escalator(f"PLATE_{fl}_ESC_{tag}", -3.5, 4.0, 12.3 + yoff, z0 + 0.05, col)


def plate_atrium(col, z0, fl):
    MATS = L.ensure_materials()
    h = 1.1
    zMid = z0 + 0.05 + h / 2.0
    segs = [
        ("FRONT", (ATRIUM_X[0] + ATRIUM_X[1]) / 2.0, ATRIUM_Y[1], ATRIUM_X[1] - ATRIUM_X[0], 0.08),
        ("BACK", (ATRIUM_X[0] + ATRIUM_X[1]) / 2.0, ATRIUM_Y[0], ATRIUM_X[1] - ATRIUM_X[0], 0.08),
        ("LEFT", ATRIUM_X[0], (ATRIUM_Y[0] + ATRIUM_Y[1]) / 2.0, 0.08, ATRIUM_Y[1] - ATRIUM_Y[0]),
        ("RIGHT", ATRIUM_X[1], (ATRIUM_Y[0] + ATRIUM_Y[1]) / 2.0, 0.08, ATRIUM_Y[1] - ATRIUM_Y[0]),
    ]
    for tag, cx, cy, sx, sy in segs:
        L.add_box(f"PLATE_{fl}_ATRIUM_RAIL_{tag}", (cx, cy, zMid), (sx, sy, h), MATS["MAT_GLASS"], col=col)
        L.add_box(f"PLATE_{fl}_ATRIUM_RAILTOP_{tag}", (cx, cy, z0 + 0.05 + h + 0.03), (sx - 0.03, sy - 0.03, 0.06), MATS["MAT_METAL"], col=col)
    posts = [(ATRIUM_X[0], ATRIUM_Y[0]), (ATRIUM_X[0], ATRIUM_Y[1]), (ATRIUM_X[1], ATRIUM_Y[0]), (ATRIUM_X[1], ATRIUM_Y[1])]
    for pi, (px, py) in enumerate(posts):
        L.add_box(f"PLATE_{fl}_ATRIUM_POST_{pi+1}", (px, py, zMid), (0.12, 0.12, h), MATS["MAT_FRAME"], col=col)


def plate_openrooms(col, z0, fl):
    MATS = L.ensure_materials()
    CA.MATS = MATS
    CA.build_openroom(f"PLATE_{fl}_TOILET_WOMEN", -5.6, -0.2, -13.6, -10.6, z0, "MAT_TILE_WHITE", col, door=True)
    CA.build_openroom(f"PLATE_{fl}_TOILET_MEN", 0.2, 5.6, -13.6, -10.6, z0, "MAT_TILE_WHITE", col, door=True)
    CA.build_openroom(f"PLATE_{fl}_SERVICE", 5.6, 6.1, -13.6, -10.6, z0, "MAT_WALL", col, door=True)


def plate_lifts(col, z0, fl):
    MATS = L.ensure_materials()
    cy = -3.6  # lift shaft band y -4.6..-2.6 (whole-building COMMON_LIFT_* layout)
    for i, (sx0, sx1) in enumerate(((-2.2, -0.2), (0.2, 2.2))):
        cx = (sx0 + sx1) / 2.0
        tag = f"{i+1:02d}"
        # low shaft stub rising from the plate + door leaf at this level
        L.add_box(f"PLATE_{fl}_LIFT_{tag}_STUB", (cx, cy, z0 + 1.5), (sx1 - sx0, 2.0, 3.0), MATS["MAT_CONCRETE"], col=col)
        L.add_box(f"PLATE_{fl}_LIFT_{tag}_DOOR", (cx, -2.6, z0 + 1.3), (1.7, 0.08, 2.4), MATS["MAT_FRAME"], col=col)


def plate_stairs(col, z0, fl):
    MATS = L.ensure_materials()
    # schematic staircase in corridor B (x 2.8..5.2): landing pad + one rising flight
    L.add_box(f"PLATE_{fl}_STAIR_PAD", (3.95, -3.6, z0 + 0.12), (2.5, 2.4, 0.12), MATS["MAT_STEP"], col=col)
    for i in range(7):
        z = z0 + 0.18 + i * 0.07
        y = -2.6 - i * 0.28
        L.add_box(f"PLATE_{fl}_STAIR_{i+1}", (3.95, y, z), (2.1, 0.3, 0.09), MATS["MAT_WALL"], col=col)


def plate_planters(col, z0, fl):
    MATS = L.ensure_materials()
    for i, (px, py) in enumerate(((-5.6, 12.6), (5.6, 12.6), (-6.5, 4.5), (6.5, 4.5))):
        L.add_box(f"PLATE_{fl}_PLANTER_{i+1}", (px, py, z0 + 0.28), (1.4, 1.4, 0.56), MATS["MAT_STONE"], col=col)
        L.add_cylinder(f"PLATE_{fl}_PLANT_{i+1}_A", (px - 0.25, py - 0.25, z0 + 0.7), 0.3, 0.8, MATS["MAT_WALL_DARK"], col=col)
        L.add_cylinder(f"PLATE_{fl}_PLANT_{i+1}_B", (px + 0.25, py + 0.25, z0 + 0.7), 0.3, 0.8, MATS["MAT_WALL_DARK"], col=col)


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------
def export_plate(tag, out_path):
    # Dev cameras must not ship in the binary.
    for obj in list(bpy.data.objects):
        if obj.type == "CAMERA":
            bpy.data.objects.remove(obj, do_unlink=True)
    col = bpy.data.collections.get(tag)
    if col is None:
        raise ValueError(f"plate collection {tag} not found")
    bpy.ops.object.select_all(action="DESELECT")
    for o in col.all_objects:
        o.select_set(o.visible_get())
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_extras=True,
        export_yup=True,
        export_apply=True,
        use_selection=True,
    )
    return out_path


def export_plates(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    out = {}
    for tag, fl, fi in PLATES:
        p = os.path.join(out_dir, f"acropolis-mall-{fl}.glb")
        export_plate(tag, p)
        out[fl] = p
    return out


if __name__ == "__main__":
    build_plates()
    out_dir = os.environ.get("MALL_PLATES_OUT") or os.path.join(
        os.path.dirname(os.path.dirname(_D)), "public", "assets", "models"
    )
    report = export_plates(out_dir)
    for fl, p in report.items():
        print("GLB_EXPORTED", p, os.path.getsize(p))