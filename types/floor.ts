/**
 * Floor and building types. Floors are part of the data layer so floor
 * metadata (label, elevation, visibility) can be supplied without touching
 * geometry. Elevation must match the Blender scene once geometry is authored
 * against authoritative drawings; for demo floors it is computed from the
 * demo geometry file.
 */

export type FloorKind = "basement" | "ground" | "upper";

export interface Floor {
  /** Stable id: `G`, `F1`, `F2`, `B1`, ... (used inside shop ids). */
  id: string;
  /** 0-based index for ordering. */
  index: number;
  label: string;
  kind: FloorKind;
  /** Vertical center of the floor slab relative to ground (meters). */
  baseElevationM: number;
  /** Floor-to-floor height (meters). */
  heightM: number;
  /** Optional description shown in the floor selector. */
  description?: string;
  /** True when demo floors were generated from procedural demo geometry. */
  isDemo: boolean;
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
  /** Total count of shop units (denormalized convenience, from data layer). */
  shopCount: number;
}