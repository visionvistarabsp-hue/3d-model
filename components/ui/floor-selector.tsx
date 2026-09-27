"use client";

import { useMallStore } from "@/store/use-mall-store";
import type { Floor } from "@/types";

interface FloorSelectorProps {
  floors: Floor[];
}

/**
 * Floor switcher: premium segmented pills bottom-center on desktop; a snap-able
 * horizontal pill row under the header on mobile. Clicking the active pill
 * again toggles back to the whole building.
 */
export function FloorSelector({ floors }: FloorSelectorProps) {
  const activeFloorId = useMallStore((s) => s.activeFloorId);
  const setActiveFloor = useMallStore((s) => s.setActiveFloor);

  if (floors.length === 0) return null;

  const floorButtons = (base: string) => {
    const pill = (isActive: boolean) =>
      `transition-all ${base} text-xs font-medium ${
        isActive ? "seg-active sm:text-sm" : "text-white/55 hover:text-white/90 sm:text-sm"
      }`;

    return (
      <>
        {floors.map((floor) => {
          const isActive =
            activeFloorId === floor.id || (activeFloorId === null && floor.index === 0);
          return (
            <button
              key={floor.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFloor(activeFloorId === floor.id ? null : floor.id)}
              className={pill(isActive)}
            >
              {floor.label}
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={activeFloorId === null}
          onClick={() => setActiveFloor(null)}
          className={pill(activeFloorId === null)}
        >
          All Floors
        </button>
      </>
    );
  };

  return (
    <>
      {/* Desktop — bottom-center */}
      <div className="pointer-events-auto absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 sm:block">
        <div
          className="luxe-panel flex gap-1 rounded-full p-1"
          role="tablist"
          aria-label="Floor selection"
        >
          {floorButtons("px-4 py-1.5")}
        </div>
      </div>

      {/* Mobile — snap-able pill row under the header */}
      <div className="absolute inset-x-0 z-20 flex justify-center px-3 sm:pointer-events-auto sm:hidden" style={{ top: "max(6rem, calc(2.5rem + env(safe-area-inset-top)))" }}>
        <div
          className="luxe-panel no-scrollbar flex scroll-px-4 snap-x gap-1.5 overflow-x-auto rounded-full p-1.5"
          role="tablist"
          aria-label="Floor selection"
        >
          {floorButtons("px-3.5 py-1.5 snap-start")}
        </div>
      </div>
    </>
  );
}