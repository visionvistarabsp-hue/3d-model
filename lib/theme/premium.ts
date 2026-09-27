/**
 * Shared premium design tokens for the "Luxe Mall" UI layer.
 * Pure presentation; no business logic.
 */
export const ACCENT_GRADIENT = "linear-gradient(135deg, #6366f1, #22d3ee)";

export const ACCENT = {
  indigo: "#6366f1",
  cyan: "#22d3ee",
  cyanSoft: "#67e8f9"
} as const;

export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}