import sys, os
_D = os.path.dirname(os.path.abspath(__file__))
if _D not in sys.path:
    sys.path.insert(0, _D)
import mall_lib as L

MATS = None
SLAB_TOP = [0.30, 4.50, 8.70]
FH = L.cfg()["floor_height"]
COR = L.cfg()["corridor_width"]
ATRIUM_X = L.cfg()["atrium_x"]
ATRIUM_Y = L.cfg()["atrium_y"]
WALL_T = L.cfg()["wall_thickness"]


def build_common_area():
    global MATS
    MATS = L.ensure_materials()
    col_mall = L.get_collection("MALL")
    col = L.get_collection("COMMON_AREA", parent=col_mall)

    # --- Atrium glass balustrades on F1 (4.5) and F2 (8.7) ---
    for fl, zc in (("F1", 4.50), ("F2", 8.70)):
        h = 1.1
        zMid = zc + 0.05 + h / 2.0
        idx = SLAB_TOP.index(zc) if zc in SLAB_TOP else (1 if fl == "F1" else 2)
        # four segments around the void
        segs = [
            ("FRONT", (ATRIUM_X[0] + ATRIUM_X[1]) / 2.0, ATRIUM_Y[1], ATRIUM_X[1] - ATRIUM_X[0], 0.08),
            ("BACK", (ATRIUM_X[0] + ATRIUM_X[1]) / 2.0, ATRIUM_Y[0], ATRIUM_X[1] - ATRIUM_X[0], 0.08),
            ("LEFT", ATRIUM_X[0], (ATRIUM_Y[0] + ATRIUM_Y[1]) / 2.0, 0.08, ATRIUM_Y[1] - ATRIUM_Y[0]),
            ("RIGHT", ATRIUM_X[1], (ATRIUM_Y[0] + ATRIUM_Y[1]) / 2.0, 0.08, ATRIUM_Y[1] - ATRIUM_Y[0]),
        ]
        for tag, cx, cy, sx, sy in segs:
            L.add_box(f"COMMON_ATRIUM_RAIL_{fl}_{tag}", (cx, cy, zMid), (sx, sy, h), MATS["MAT_GLASS"], col=col)
            L.add_box(f"COMMON_ATRIUM_RAILTOP_{fl}_{tag}", (cx, cy, zc + 0.05 + h + 0.03), (sx - 0.03, sy - 0.03, 0.06), MATS["MAT_METAL"], col=col)
        # corner posts
        posts = [(ATRIUM_X[0], ATRIUM_Y[0]), (ATRIUM_X[0], ATRIUM_Y[1]), (ATRIUM_X[1], ATRIUM_Y[0]), (ATRIUM_X[1], ATRIUM_Y[1])]
        for pi, (px, py) in enumerate(posts):
            L.add_box(f"COMMON_ATRIUM_POST_{fl}_{pi+1}", (px, py, zMid), (0.12, 0.12, h), MATS["MAT_FRAME"], col=col)

    # --- Escalators spanning entrance atrium (x -3.5 .. 4.0, y 11.9/12.7, ~29 deg) ---
    for tag, yoff in (("A", -0.4), ("B", 0.4)):
        for seg, zbase in (("G", 0.05), ("F1", 4.55)):
            build_escalator(f"COMMON_ESC_{seg}_{tag}", -3.5, 4.0, 12.3 + yoff, zbase, col)
    return col


def build_escalator(name, x0, x1, y, zbase, col):
    """Single inclined escalator from (x0,y,zbase) risen 4.2 to (x1,y,zbase+4.2)."""
    run = x1 - x0
    rise = 4.2
    top_z = zbase + rise
    L.add_tilted(name + "_TREAD", (x0, y, zbase + 0.05), (x1, y, top_z + 0.18), 1.4, 0.3, MATS["MAT_METAL"], col=col)
    for side, yoff in (("L", -0.85), ("R", 0.85)):
        L.add_tilted(name + f"_SIDE_{side}", (x0, y, zbase), (x1, y, top_z + 0.18), 0.24, 1.0, MATS["MAT_FRAME"], col=col, y=y + yoff)
    # handrails
    for side, yoff in (("L", -0.45), ("R", 0.45)):
        L.add_tilted(name + f"_RAIL_{side}", (x0, y, zbase + 0.8), (x1, y, top_z + 0.98), 0.1, 0.35, MATS["MAT_CHROME"], col=col, y=y + yoff)
    # baluster panels between treads
    for i, t in enumerate([0.3, 0.7]):
        bx = x0 + run * t
        bz = zbase + rise * t
        L.add_box(name + f"_BALUSTER_{i+1}", (bx, y, bz + 0.5), (0.06, 1.5, 1.0), MATS["MAT_GLASS"], col=col)
    # landing pads
    L.add_box(name + "_LAND_B", (x0 - 0.9, y, zbase + 0.08), (1.4, 1.5, 0.16), MATS["MAT_METAL"], col=col)
    L.add_box(name + "_LAND_T", (x1 + 0.9, y, top_z + 0.32), (1.4, 1.5, 0.45), MATS["MAT_METAL"], col=col)


# ---------------------------------------------------------------------------
def build_lifts():
    global MATS
    MATS = L.ensure_materials()
    col_mall = L.get_collection("MALL")
    col = L.get_collection("COMMON_AREA", parent=col_mall)
    # two lift shafts in corridor B (y -4.6..-2.6), x [-2.2,-0.2] and [0.2,2.2]
    for i, (sx0, sx1) in enumerate(((-2.2, -0.2), (0.2, 2.2))):
        cx, cy = (sx0 + sx1) / 2.0, (-4.6 + -2.6) / 2.0
        tag = f"{i+1:02d}"
        L.add_box(f"COMMON_LIFT_{tag}_SHAFT", (cx, cy, 6.45), (sx1 - sx0, 2.0, 12.9), MATS["MAT_CONCRETE"], col=col)
        for fl, zbase in enumerate((0.30, 4.50, 8.70)):
            L.add_box(f"COMMON_LIFT_{tag}_DOOR_{fl+1}", (cx, -2.6, zbase + 1.3), (1.7, 0.08, 2.4), MATS["MAT_FRAME"], col=col)


def build_stairs():
    global MATS
    MATS = L.ensure_materials()
    col_mall = L.get_collection("MALL")
    col = L.get_collection("COMMON_AREA", parent=col_mall)

    # Main staircase in corridor B (x 2.7..5.2, y -4.8..-2.4): return/Q-turn, 4 flights G..F2
    # 2 bays: bay1 (x 2.8..4.0), bay2 (x 4.0..5.2); flights along Y
    riser, tread = 0.21, 0.26
    stairs_run = 4.2
    def flight(name, x, y0, y1, z0, z1, width):
        n = max(1, int(round((z1 - z0) / riser)))
        dz = (z1 - z0) / n
        for i in range(n):
            L.add_box(f"{name}_{i+1}", (x, y0 - (i + 0.5) * (y0 - y1) / n, z0 + (i + 0.5) * dz), (width, abs(y1 - y0) / n + 0.02, dz + 0.02), MATS["MAT_STEP"], col=col)
        return n

    bay_x = [3.0, 4.6]
    # G->F1 via mid landing
    flight("COMMON_STAIR_A1", bay_x[0], -2.6, -4.3, 0.30, 2.55, 1.3)
    L.add_box("COMMON_STAIR_PL_A", (3.8, -4.3, 2.55), (1.6, 1.5, 0.1), MATS["MAT_STEP"], col=col)
    flight("COMMON_STAIR_A2", bay_x[1], -4.3, -2.7, 2.55, 4.50, 1.3)
    # F1->F2
    flight("COMMON_STAIR_A3", bay_x[0], -2.7, -4.3, 4.50, 6.75, 1.3)
    flight("COMMON_STAIR_A4", bay_x[1], -4.3, -2.9, 6.75, 8.70, 1.3)
    return col


def build_toilets():
    global MATS
    MATS = L.ensure_materials()
    col_mall = L.get_collection("MALL")
    col = L.get_collection("COMMON_AREA", parent=col_mall)
    # back band y -14..-10; rooms at y -13.6..-10.6 (3.0 deep), x windows:
    #   women x -5.6..-0.2, men x 0.2..5.6, service x 5.6..6.1? -> keep service small
    rooms = {
        "WOMEN": (-5.6, -0.2, "MAT_TILE_WHITE"),
        "MEN": (0.2, 5.6, "MAT_TILE_WHITE"),
    }
    for idxf, zbase in enumerate((0.30, 4.50, 8.70)):
        fl = ("G", "F1", "F2")[idxf]
        for kind, (rx0, rx1, matname) in rooms.items():
            build_openroom(f"COMMON_TOILET_{kind}_{fl}", rx0, rx1, -13.6, -10.6, zbase, matname, col, door=True)
        build_openroom(f"COMMON_SERVICE_{fl}", 5.6, 6.1, -13.6, -10.6, zbase, "MAT_WALL", col, door=True)
    return col


def build_openroom(name, x0, x1, y0, y1, zbase, matname, col, door=True):
    """Open-walled room: floor pad + 4 walls + door leaf."""
    L.add_box(name + "_FLR", ((x0 + x1) / 2.0, (y0 + y1) / 2.0, zbase + 0.05), (x1 - x0, y1 - y0, 0.1), MATS[matname], col=col)
    h = 2.7
    zc = zbase + h / 2.0
    L.add_box(name + "_W_B", ((x0 + x1) / 2.0, y0, zc), (x1 - x0, WALL_T, h), MATS[matname], col=col)
    L.add_box(name + "_W_L", (x0, (y0 + y1) / 2.0, zc), (WALL_T, y1 - y0, h), MATS[matname], col=col)
    L.add_box(name + "_W_R", (x1, (y0 + y1) / 2.0, zc), (WALL_T, y1 - y0, h), MATS[matname], col=col)
    L.add_box(name + "_W_F", ((x0 + x1) / 2.0, y1, zc), (x1 - x0, WALL_T, h), MATS[matname], col=col)
    if door:
        L.add_box(name + "_DOOR", ((x0 + x1) / 2.0, y1, zbase + 1.1), (0.9, 0.06, 2.2), MATS["MAT_FRAME"], col=col)
    # toilet fixtures (women/men): simple stalls + sinks
    if "TOILET" in name:
        n = max(1, int((x1 - x0 - 0.6) // 0.9))
        for i in range(n):
            px = x0 + 0.4 + i * 0.9
            L.add_box(name + f"_STALL_{i+1}", (px, y0 + 0.45, zbase + 0.45), (0.8, 0.9, 0.9), MATS["MAT_STONE"], col=col)
        L.add_box(name + "_SINK", ((x0 + x1) / 2.0, y0 + 0.2, zbase + 0.8), (min(2.2, x1 - x0 - 0.4), 0.35, 0.75), MATS["MAT_FIXTURE"], col=col)


def build_planters():
    global MATS
    MATS = L.ensure_materials()
    col_mall = L.get_collection("MALL")
    col = L.get_collection("COMMON_AREA", parent=col_mall)
    for i, (px, py) in enumerate(((-5.6, 12.6), (5.6, 12.6), (-6.5, 4.5), (6.5, 4.5))):
        L.add_box(f"COMMON_PLANTER_{i+1}", (px, py, 0.28), (1.4, 1.4, 0.56), MATS["MAT_STONE"], col=col)
        L.add_cylinder(f"COMMON_PLANT_{i+1}_A", (px - 0.25, py - 0.25, 0.7), 0.3, 0.8, MATS["MAT_WALL_DARK"], col=col)
        L.add_cylinder(f"COMMON_PLANT_{i+1}_B", (px + 0.25, py + 0.25, 0.7), 0.3, 0.8, MATS["MAT_WALL_DARK"], col=col)


if __name__ == "__main__":
    build_common_area()
    build_lifts()
    build_stairs()
    build_toilets()
    build_planters()
    print("common area built")