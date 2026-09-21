"use client";

/**
 * Floating top status bar. Shows the building title, an explicit demo-data
 * banner, and view-mode switches. HTML overlay — deliberately NOT inside the
 * three.js canvas so it stays crisp and accessible.
 */
import { useMallStore } from "@/store/use-mall-store";
import { VIEW_MODES, type ViewMode } from "@/types/view-mode";
import { VIEW_MODE_ACCENT } from "@/lib/theme/shop-colors";

export function StatusBar({ title }: { title?: string }) {
  const viewMode = useMallStore((s) => s.viewMode);
  const setViewMode = useMallStore((s) => s.setViewMode);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="demo-banner px-4 py-1.5 text-[11px] font-medium tracking-wide text-yellow-200/90">
        Prototype build — all shop data and geometry shown here are DEMO DATA,
        not real commercial facts.
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <h1 className="text-sm font-semibold text-white/90">
          {title ?? "Mall 3D Explorer"}
        </h1>

        <div
          className="pointer-events-auto flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur"
          role="tablist"
          aria-label="View mode"
        >
          {(Object.keys(VIEW_MODES) as ViewMode[]).map((mode) => {
            const def = VIEW_MODES[mode];
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setViewMode(mode)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/55 hover:text-white/80"
                }`}
                style={active ? { color: VIEW_MODE_ACCENT[mode] } : undefined}
              >
                {def.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}