/**
 * Barrel for canonical application types. Types MUST stay in lockstep with the
 * zod schemas in `lib/validation/schemas.ts` (AGENTS rule 7).
 */
export type {
  Shop,
  ShopStatus,
  ShopCategory,
  ShopCoordinates,
  ShopMediaAsset
} from "./shop";
export type { Floor, FloorKind, Building } from "./floor";
export type {
  ViewMode,
  ViewModeDefinition,
  EffectConfig,
  DeviceTier,
  DeviceProfile,
  SelectionBehavior
} from "./view-mode";
export {
  VIEW_MODES
} from "./view-mode";
export type { ModelMetadata, FloorModelRef } from "./model";