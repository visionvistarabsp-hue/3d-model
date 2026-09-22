import sys, os
_D = os.path.dirname(os.path.abspath(__file__))
if _D not in sys.path:
    sys.path.insert(0, _D)
import mall_lib as L

MATS = None

FOOT_X0, FOOT_X1 = -7.9, 7.9
FOOT_Y0, FOOT_Y1 = -14.0, 14.2
WALL_T = 0.2
SLAB_T = L.cfg()["slab_thickness"]
SLAB_TOP = [0.30, 4.50, 8.70]
ROOF_BOT, ROOF_TOP = 12.6, 12.9
ATRIUM_X = L.cfg()["atrium_x"]
ATRIUM_Y = L.cfg()["atrium_y"]

COL_X = [-2.6, 2.6]
COL_Y = [4.5, -3.5]
COL_R = L.cfg()["column_radius"]


def slab_center_z(idx):
    return SLAB_TOP[idx] - SLAB_T / 2.0


def full_slab_boxes(x0, x1, y0, y1, zc, w_z):
    return [((x0 + x1) / 2.0, (y0 + y1) / 2.0, zc, (x1 - x0), (y1 - y0), w_z)]


def atrium_slab_boxes(zy, y0, y1):
    """Slab for F1/F2 level with atrium opening removed (4 boxes)."""
    ax0, ax1 = ATRIUM_X
    ay0, ay1 = ATRIUM_Y
    boxes = []
    boxes.append(((FOOT_X0 + ax0) / 2.0, (y0 + y1) / 2.0, zy, ax0 - FOOT_X0, y1 - y0, SLAB_T))
    boxes.append(((ax1 + FOOT_X1) / 2.0, (y0 + y1) / 2.0, zy, FOOT_X1 - ax1, y1 - y0, SLAB_T))
    boxes.append(((ax0 + ax1) / 2.0, (y0 + ay0) / 2.0, zy, ax1 - ax0, ay0 - y0, SLAB_T))
    boxes.append(((ax0 + ax1) / 2.0, (ay1 + y1) / 2.0, zy, ax1 - ax0, y1 - ay1, SLAB_T))
    return boxes


def build_structure():
    global MATS
    MATS = L.ensure_materials()
    col_struct = L.get_collection("MALL")
    col_sub = L.get_collection("MALL_STRUCTURE", parent=col_struct)

    # --- Ground / site ---
    L.add_box("SITE_GROUND", (0.0, 0.0, -0.05), (92.0, 96.0, 0.1), MATS["MAT_CONCRETE"], col=col_sub)
    L.add_box("MALL_PLAZA", (0.0, 15.2, 0.0), (6.4, 3.2, 0.1), MATS["MAT_STONE"], col=col_sub)

    # --- Floor slabs ---
    for x, y, z, sx, sy, sz in full_slab_boxes(FOOT_X0, FOOT_X1, FOOT_Y0, FOOT_Y1, slab_center_z(0), SLAB_T):
        L.add_box("MALL_SLAB_G", (x, y, z), (sx, sy, sz), MATS["MAT_WALL"], col=col_sub)
    for idx in [1, 2]:
        for bi, (x, y, z, sx, sy, sz) in enumerate(atrium_slab_boxes(slab_center_z(idx), FOOT_Y0, FOOT_Y1), start=1):
            L.add_box(f"MALL_SLAB_F{idx}_{bi}", (x, y, z), (sx, sy, sz), MATS["MAT_WALL"], col=col_sub)

    # --- Roof (full minus atrium skylight) ---
    roof_boxes = []
    ax0, ax1 = ATRIUM_X
    ay0, ay1 = ATRIUM_Y
    roof_boxes.append(((FOOT_X0 + ax0) / 2.0, (FOOT_Y0 + FOOT_Y1) / 2.0, (ROOF_BOT + ROOF_TOP) / 2.0, ax0 - FOOT_X0, FOOT_Y1 - FOOT_Y0, ROOF_TOP - ROOF_BOT))
    roof_boxes.append(((ax1 + FOOT_X1) / 2.0, (FOOT_Y0 + FOOT_Y1) / 2.0, (ROOF_BOT + ROOF_TOP) / 2.0, FOOT_X1 - ax1, FOOT_Y1 - FOOT_Y0, ROOF_TOP - ROOF_BOT))
    roof_boxes.append(((ax0 + ax1) / 2.0, (FOOT_Y0 + ay0) / 2.0, (ROOF_BOT + ROOF_TOP) / 2.0, ax1 - ax0, ay0 - FOOT_Y0, ROOF_TOP - ROOF_BOT))
    roof_boxes.append(((ax0 + ax1) / 2.0, (ay1 + FOOT_Y1) / 2.0, (ROOF_BOT + ROOF_TOP) / 2.0, ax1 - ax0, FOOT_Y1 - ay1, ROOF_TOP - ROOF_BOT))
    for i, (x, y, z, sx, sy, sz) in enumerate(roof_boxes):
        L.add_box(f"MALL_ROOF_{['A','B','C','D'][i]}", (x, y, z), (sx, sy, sz), MATS["MAT_ROOF"], col=col_sub)

    # --- Skylight over atrium ---
    zc = ROOF_TOP - 0.15
    L.add_box("MALL_SKYLIGHT_FRAME_L", (ax0, (ay0 + ay1) / 2.0, zc), (0.12, ay1 - ay0, 0.3), MATS["MAT_FRAME"], col=col_sub)
    L.add_box("MALL_SKYLIGHT_FRAME_R", (ax1, (ay0 + ay1) / 2.0, zc), (0.12, ay1 - ay0, 0.3), MATS["MAT_FRAME"], col=col_sub)
    L.add_box("MALL_SKYLIGHT_FRAME_F", ((ax0 + ax1) / 2.0, ay1, zc), (ax1 - ax0, 0.12, 0.3), MATS["MAT_FRAME"], col=col_sub)
    L.add_box("MALL_SKYLIGHT_FRAME_B", ((ax0 + ax1) / 2.0, ay0, zc), (ax1 - ax0, 0.12, 0.3), MATS["MAT_FRAME"], col=col_sub)
    for i, gx in enumerate([-2.2, 0.0, 2.2]):
        L.add_box(f"MALL_SKYLIGHT_PANEL_{i+1}", (gx, (ay0 + ay1) / 2.0, zc), (2.0, ay1 - ay0 - 0.12, 0.06), MATS["MAT_GLASS"], col=col_sub)

    # --- Perimeter walls ---
    L.add_box("MALL_WALL_SIDE_L", (FOOT_X0 - WALL_T / 2.0, (FOOT_Y0 + FOOT_Y1) / 2.0, (ROOF_TOP) / 2.0), (WALL_T, FOOT_Y1 - FOOT_Y0, ROOF_TOP), MATS["MAT_CONCRETE"], col=col_sub)
    L.add_box("MALL_WALL_SIDE_R", (FOOT_X1 + WALL_T / 2.0, (FOOT_Y0 + FOOT_Y1) / 2.0, (ROOF_TOP) / 2.0), (WALL_T, FOOT_Y1 - FOOT_Y0, ROOF_TOP), MATS["MAT_CONCRETE"], col=col_sub)
    L.add_box("MALL_WALL_REAR", ((FOOT_X0 + FOOT_X1) / 2.0, FOOT_Y0 - WALL_T / 2.0, (ROOF_TOP) / 2.0), (FOOT_X1 - FOOT_X0, WALL_T, ROOF_TOP), MATS["MAT_CONCRETE"], col=col_sub)

    # --- Structural columns ---
    for i, cx in enumerate(COL_X):
        for j, cy in enumerate(COL_Y):
            L.add_cylinder(f"MALL_COLUMN_{i*2+j+1}", (cx, cy, ROOF_TOP / 2.0), COL_R, ROOF_TOP, MATS["MAT_CONCRETE"], col=col_sub, verts=16)

    # --- Roof parapets ---
    pz = (ROOF_TOP + ROOF_TOP + 0.55) / 2.0
    ph = 0.55
    L.add_box("MALL_PARAPET_F", ((FOOT_X0 + FOOT_X1) / 2.0, FOOT_Y1 + WALL_T / 2.0, pz), (FOOT_X1 - FOOT_X0, WALL_T, ph), MATS["MAT_CONCRETE"], col=col_sub)
    L.add_box("MALL_PARAPET_B", ((FOOT_X0 + FOOT_X1) / 2.0, FOOT_Y0 - WALL_T / 2.0, pz), (FOOT_X1 - FOOT_X0, WALL_T, ph), MATS["MAT_CONCRETE"], col=col_sub)
    L.add_box("MALL_PARAPET_L", (FOOT_X0 - WALL_T / 2.0, (FOOT_Y0 + FOOT_Y1) / 2.0, pz), (WALL_T, FOOT_Y1 - FOOT_Y0, ph), MATS["MAT_CONCRETE"], col=col_sub)
    L.add_box("MALL_PARAPET_R", (FOOT_X1 + WALL_T / 2.0, (FOOT_Y0 + FOOT_Y1) / 2.0, pz), (WALL_T, FOOT_Y1 - FOOT_Y0, ph), MATS["MAT_CONCRETE"], col=col_sub)

    return col_sub


def build_facade():
    global MATS
    MATS = L.ensure_materials()
    col_struct = L.get_collection("MALL")
    col_sub = L.get_collection("MALL_STRUCTURE", parent=col_struct)
    y = FOOT_Y1
    t = 0.12

    def glass_panel(name, x0, x1, z0, z1):
        L.add_box(name, ((x0 + x1) / 2.0, y, (z0 + z1) / 2.0), (x1 - x0, t, z1 - z0), MATS["MAT_GLASS"], col=col_sub)

    def frame(name, x0, x1, z0, z1, thick=0.16):
        L.add_box(name, ((x0 + x1) / 2.0, y, (z0 + z1) / 2.0), (x1 - x0, thick, z1 - z0), MATS["MAT_FRAME"], col=col_sub)

    # Plinth
    L.add_box("MALL_FACADE_PLINTH", ((FOOT_X0 + FOOT_X1) / 2.0, y, 0.45), (FOOT_X1 - FOOT_X0, 0.14, 0.9), MATS["MAT_STONE"], col=col_sub)
    # Band 1 glass (left + right of entrance)
    glass_panel("MALL_FACADE_B1_L", -7.9, -2.6, 0.9, 4.2)
    glass_panel("MALL_FACADE_B1_R", 2.6, 7.9, 0.9, 4.2)
    # Band 2 & 3 glass (full width)
    glass_panel("MALL_FACADE_B2", -7.9, 7.9, 4.5, 8.7)
    glass_panel("MALL_FACADE_B3", -7.9, 7.9, 9.0, 12.6)
    # Spandrels
    L.add_box("MALL_FACADE_SPANDREL_1", ((FOOT_X0 + FOOT_X1) / 2.0, y, 4.35), (FOOT_X1 - FOOT_X0, 0.08, 0.3), MATS["MAT_WALL_DARK"], col=col_sub)
    L.add_box("MALL_FACADE_SPANDREL_2", ((FOOT_X0 + FOOT_X1) / 2.0, y, 8.85), (FOOT_X1 - FOOT_X0, 0.08, 0.3), MATS["MAT_WALL_DARK"], col=col_sub)
    # Verticals flanking the entrance
    frame("MALL_FACADE_JAMB_L", -2.75, -2.45, 0.0, 4.2)
    frame("MALL_FACADE_JAMB_R", 2.45, 2.75, 0.0, 4.2)
    # Entrance doors + transom + canopy
    L.add_box("MALL_ENTRANCE_DOOR_L", (-1.4, y, 2.1), (1.2, 0.08, 4.2), MATS["MAT_GLASS"], col=col_sub)
    L.add_box("MALL_ENTRANCE_DOOR_R", (1.4, y, 2.1), (1.2, 0.08, 4.2), MATS["MAT_GLASS"], col=col_sub)
    L.add_box("MALL_ENTRANCE_FRAME", (0.0, y, 2.1), (5.2, 0.06, 4.2), MATS["MAT_FRAME"], col=col_sub)
    # Canopy
    L.add_box("MALL_CANOPY_SLAB", (0.0, 15.1, 4.275), (6.8, 3.2, 0.15), MATS["MAT_STONE"], col=col_sub)
    L.add_box("MALL_CANOPY_STRUT_L", (-2.9, 14.4, 2.1), (0.12, 0.12, 4.3), MATS["MAT_METAL"], col=col_sub)
    L.add_box("MALL_CANOPY_STRUT_R", (2.9, 14.4, 2.1), (0.12, 0.12, 4.3), MATS["MAT_METAL"], col=col_sub)
    return col_sub