import sys, os
_D = os.path.dirname(os.path.abspath(__file__))
if _D not in sys.path:
    sys.path.insert(0, _D)
import mall_lib as L

MATS = None

FLOORS = ["G", "F1", "F2"]
FLOOR_INDEX = {"G": 0, "F1": 1, "F2": 2}
SLAB_T = L.cfg()["slab_thickness"]
# z of floor walking surface for each floor (slab tops)
SLAB_TOP = [0.30, 4.50, 8.70]
SHOP_W = L.cfg()["shop_width"]
SHOP_D = L.cfg()["shop_depth"]
WALL_T = L.cfg()["wall_thickness"]

# category keyed by floor -> seq (1..9)
CATEGORIES = {
    "G": {1: "anchor", 2: "retail", 3: "retail", 4: "retail", 5: "anchor", 6: "retail",
          7: "retail", 8: "retail", 9: "retail"},
    "F1": {1: "food_and_beverage", 2: "food_and_beverage", 3: "food_and_beverage",
           4: "food_and_beverage", 5: "food_and_beverage", 6: "food_and_beverage",
           7: "services", 8: "services", 9: "services"},
    "F2": {1: "entertainment", 2: "entertainment", 3: "office", 4: "office", 5: "office",
           6: "office", 7: "office", 8: "wellness", 9: "retail"},
}

STATUSES = ["AVAILABLE", "RESERVED", "LEASED"]


def shop_center_idx(seq):
    row = (seq - 1) // 3  # 0..2
    col = (seq - 1) % 3   # 0..2
    x = (col - 1) * (SHOP_W + WALL_T)
    y = 8.5 - row * 8.0  # row0 -> 8.5, row1 -> 0.5, row2 -> -7.5
    return x, y


def floor_label(idx):
    return FLOORS[idx]


def build_floor(idx, z_base=None, col_floor=None):
    """Build the 9 shops of a floor.

    Default behaviour (whole-building export): creates the MALL/SHOPS/<FLOOR>
    collection tree and places the floor at its absolute slab top.

    Plate mode: pass `z_base` (slab-top normalised to 0) and `col_floor` so
    the shops build directly into an existing plate collection at z=0.
    Shop ids / statuses / categories are unchanged in either mode.
    """
    global MATS
    MATS = L.ensure_materials()
    if col_floor is None:
        col_mall = L.get_collection("MALL")
        col_shops = L.get_collection("SHOPS", parent=col_mall)
        col_floor = L.get_collection(FLOORS[idx], parent=col_shops)

    if z_base is None:
        z_base = SLAB_TOP[idx]
    clear_h = L.cfg()["floor_height"] - SLAB_T  # 3.9 usable interior height
    wall_zc = z_base + clear_h / 2.0

    for seq in range(1, 10):
        xc, yc = shop_center_idx(seq)
        sid = f"SHOP_{FLOORS[idx]}_{seq:03d}"
        status = STATUSES[(idx + seq) % 3]

        # --- shell parts (joined into one mesh, walls only; slab = floor/ceiling) ---
        parts = []
        # side walls (east/west)
        parts.append(L.add_box(f"{sid}_WL", (xc - SHOP_W / 2.0 + WALL_T / 2.0, yc, wall_zc), (WALL_T, SHOP_D, clear_h), MATS["MAT_WALL"], col=None))
        parts.append(L.add_box(f"{sid}_WR", (xc + SHOP_W / 2.0 - WALL_T / 2.0, yc, wall_zc), (WALL_T, SHOP_D, clear_h), MATS["MAT_WALL"], col=None))
        # back wall (south)
        parts.append(L.add_box(f"{sid}_WB", (xc, yc - SHOP_D / 2.0 + WALL_T / 2.0, wall_zc), (SHOP_W, WALL_T, clear_h), MATS["MAT_WALL"], col=None))

        prop_dict = {
            "shopId": sid,
            "shop_id": f"{FLOORS[idx]}-{seq:03d}",
            "floor": FLOORS[idx],
            "floor_id": FLOORS[idx],
            "floor_index": idx,
            "row": (seq - 1) // 3 + 1,
            "column": (seq - 1) % 3 + 1,
            "area_sq_m": SHOP_W * SHOP_D,
            "area_sq_ft": round(SHOP_W * SHOP_D * 10.7639, 1),
            "status": status,
            "category": CATEGORIES[FLOORS[idx]][seq],
            "isDemo": True,
        }

        main = L.join_objects([p.name for p in parts], sid, col=col_floor)
        L.prop(main, prop_dict)

        # --- front glass + door + sign (separate parts carrying userData.shopId) ---
        fy = yc + SHOP_D / 2.0
        sign_bot = z_base + clear_h - 0.75
        glass_top = z_base + clear_h - 0.35
        glass = L.add_box(f"{sid}_GLASS", (xc, fy + 0.04, z_base + (glass_top - z_base) / 2.0), (SHOP_W - 0.4, 0.08, glass_top - z_base), MATS["MAT_GLASS"], col=col_floor)
        door = L.add_box(f"{sid}_DOOR", (xc, fy + 0.09, z_base + 1.2), (1.6, 0.1, 2.4), MATS["MAT_FRAME"], col=col_floor)
        sign = L.add_box(f"{sid}_SIGN", (xc, fy + 0.16, sign_bot + 0.225), (4.0, 0.08, 0.45), MATS["MAT_SIGN"], col=col_floor)
        for part in (glass, door, sign):
            L.prop(part, {"shopId": sid, "floor": FLOORS[idx], "floor_id": FLOORS[idx], "floor_index": idx, "isDemo": True, "part": part.name.split("_")[-1]})
    return col_floor


def build_shops():
    for idx in range(len(FLOORS)):
        build_floor(idx)


if __name__ == "__main__":
    build_shops()
    print("shops built")