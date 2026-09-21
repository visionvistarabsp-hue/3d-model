/**
 * DEMO floors — procedurally generated mall layout.
 *
 * EVERYTHING HERE IS DEMO DATA. These dimensions are invented for a working
 * prototype and must NOT be presented as real-world facts. When authoritative
 * floor-plan drawings (DWG/DXF/PDF) are available, replace this module with
 * the validated layout and re-run the Blender pipeline.
 *
 * Floor heights and base elevations must stay in sync with the demo Blender
 * build (blender/scripts/build_demo_mall.py).
 */
import type { Building, Floor } from "@/types";

const HEIGHT_M = 4.2; // demo floor-to-floor (invented)
const ELEV_G = 0.0;
const ELEV_F1 = HEIGHT_M;
const ELEV_F2 = 2 * HEIGHT_M;

export function demoFloors(): Floor[] {
  return [
    {
      id: "G",
      index: 0,
      label: "Ground Floor",
      kind: "ground",
      baseElevationM: ELEV_G,
      heightM: HEIGHT_M,
      description: "Demo ground level: fashion & lifestyle.",
      isDemo: true
    },
    {
      id: "F1",
      index: 1,
      label: "First Floor",
      kind: "upper",
      baseElevationM: ELEV_F1,
      heightM: HEIGHT_M,
      description: "Demo first floor: food court & services.",
      isDemo: true
    },
    {
      id: "F2",
      index: 2,
      label: "Second Floor",
      kind: "upper",
      baseElevationM: ELEV_F2,
      heightM: HEIGHT_M,
      description: "Demo second floor: entertainment & offices.",
      isDemo: true
    }
  ];
}

export const DEMO_BUILDING: Building = {
  id: "MALL_DEMO_001",
  name: "Demo Mall (procedural)",
  floors: demoFloors(),
  shopCount: 0 // filled by generator in shops.ts
};