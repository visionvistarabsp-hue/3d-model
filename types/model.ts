/**
 * Metadata describing an exported GLB model.
 *
 * This is the contract between the Blender export pipeline and the web app.
 * The web app never hardcodes geometry facts; it reads this manifest, which is
 * validated by ModelMetadataSchema.
 */

export interface FloorModelRef {
  floorId: string;
  /** Storage key for the floor's GLB (resolved via StorageClient). */
  glbKey: string;
  /** Optional override per floor; defaults to the building manifest. */
  url?: string;
}

export interface ModelMetadata {
  /** Falls back to `demo` if absent. */
  source: "demo" | "authoritative" | "mixed";
  /**
   * `true` => geometry was generated procedurally and is NOT based on
   * architectural drawings. Never present demo geometry as accurate.
   */
  isDemo: boolean;
  modelId: string;
  label: string;
  version: string;
  /** Units the model was authored in (Blender default = meters). */
  units: "meters";
  /** Single-file model, or one file per floor. */
  layout: "single" | "per_floor";
  glbKey: string;
  floors: FloorModelRef[];
  /** Object naming convention the exports adhere to. */
  objectNaming: string;
  /** Total mesh objects (informational). */
  objectCount: number;
  exportedAt: string;
  /** Blender version + export script version that produced the file. */
  toolchain: {
    blenderVersion: string;
    scriptVersion: string;
  };
}