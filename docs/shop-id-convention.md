# Shop ID & Object Naming Convention

Every shop has a **stable, human-readable id** that survives exports, database
migrations and UI screens. The id is the single join key between the 3D mesh,
the data layer and the UI.

## Format

```
SHOP_<FLOOR>_<SEQ>
```

| Part | Meaning | Example |
|---|---|---|
| `SHOP_` | literal prefix — every shop object | `SHOP_G_001` |
| `<FLOOR>` | floor code | `G`, `F1`, `F2`, `B1` |
| `<SEQ>` | 3+ digit sequence, unique per floor | `001`, `007` |

`<SEQ>` is assigned by the data pipeline (shop PLAN per floor), NOT by the
Blender export order — so re-exporting never renumbers shops.

## Blender object names (must literally equal the shop id)

| Pattern | Objects | Selectable |
|---|---|---|
| `SHOP_<FLOOR>_<SEQ>` | every tenant unit | ✅ yes |
| `MALL_<FLOOR>_STRUCT` | slabs, columns, walls, roof | ❌ no |
| `COMMON_<FLOOR>_<NAME>` | atrium, corridor, escalator | ❌ no |
| `SITE_*` | ground plane, context | ❌ no |

Each shop mesh also carries `userData.shopId = <id>`, checked at load time.

## Floor codes

| Code | Kind |
|---|---|
| `B<n>` | basement (0 = ground-most basement) |
| `G` | ground floor |
| `F<n>` | upper floor (F1 = first above ground) |

## Parsing (web app)

`parseShopObjectName(name)` in `lib/select/shop-id.ts`:
- matches `/^SHOP_([A-Z0-9]+)_(\d{3,})$/`
- returns `{ shopId, floorId, sequence }` or `null` (never throws)
- case-insensitive input, canonical uppercase output

## Rules
1. Never rename objects after the first export — ids are contractual.
2. `<SEQ>` must be unique within a floor and stable across exports.
3. A shop id may exist in the data layer without a mesh (future unit) but a mesh
   without a data record must be treated as "no listing available".