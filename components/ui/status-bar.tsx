"use client";

/**
 * Floating top bar. Shows the building title, an explicit demo-data banner,
 * and the view-mode switcher as a premium segmented control. HTML overlay —
 * deliberately NOT inside the three.js canvas so it stays crisp and accessible.
 * Icons only on mobile; labels fade in from `sm:`.
 */
import { useMallStore } from "@/store/use-mall-store";
import { VIEW_MODES, type ViewMode } from "@/types/view-mode";
import { VIEW_MODE_ACCENT } from "@/lib/theme/shop-colors";
import { IconBuilding, IconHologram, IconXRay } from "@/components/ui/icons";

const MODE_ICONS: Record<ViewMode, (props: { className?: string }) => React.ReactNode> = {
  realistic: IconBuilding,
  hologram: IconHologram,
  xray: IconXRay
};

export function StatusBar({ title }: { title?: string }) {
  const viewMode = useMallStore((s) => s.viewMode);
  const setViewMode = useMallStore((s) => s.setViewMode);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="demo-banner flex items-center gap-2 px-4 py-1.5 text-[9px] font-medium uppercase tracking-[0.14em] sm:text-[10px]" style={{ paddingTop: "max(0.375rem, env(safe-area-inset-top))" }}>
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        <span className="truncate">
          Prototype build — all shop data and geometry shown here are DEMO DATA, not real commercial facts.
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5" style={{ paddingTop: "max(1rem, calc(0.5rem + env(safe-area-inset-top)))", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))" }}>
        <h1 className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, #6366f1, #22d3ee)",
              boxShadow: "0 0 10px rgba(99, 102, 241, 0.9)"
            }}
          />
          <span className="truncate text-sm font-semibold tracking-tight text-white/95 sm:text-base">
            {title ?? "Mall 3D Explorer"}
          </span>
          <span className="hidden shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/55 sm:inline-block">
            Demo
          </span>
        </h1>

        <div
          className="pointer-events-auto flex shrink-0 gap-1 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-xl"
          role="tablist"
          aria-label="View mode"
        >
          {(Object.keys(VIEW_MODES) as ViewMode[]).map((mode) => {
            const def = VIEW_MODES[mode];
            const active = viewMode === mode;
            const Icon = MODE_ICONS[mode];
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setViewMode(mode)}
                className={`flex items-center justify-center rounded-full p-2 text-xs font-medium transition-all sm:px-3.5 sm:py-1.5 sm:text-xs ${
                  active ? "seg-active" : "text-white/55 hover:text-white/90"
                }`}
                style={!active ? { color: VIEW_MODE_ACCENT[mode] } : undefined}
              >
                <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only sm:inline">{def.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}