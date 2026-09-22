"use client";

import { useMallStore } from "@/store/use-mall-store";
import type { Floor } from "@/types";

interface FloorSelectorProps {
  floors: Floor[];
}

export function FloorSelector({ floors }: FloorSelectorProps) {
  const activeFloorId = useMallStore((s) => s.activeFloorId);
  const setActiveFloor = useMallStore((s) => s.setActiveFloor);

  if (floors.length === 0) return null;

  return (
    <div
      className="pointer-events-auto absolute left-4 bottom-4 z-20 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur"
      role="tablist"
      aria-label="Floor selection"
    >
      {floors.map((floor) => {
        const isActive = activeFloorId === floor.id || (activeFloorId === null && floor.index === 0);
        return (
          <button
            key={floor.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveFloor(activeFloorId === floor.id ? null : floor.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white/90"
            }`}
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
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          activeFloorId === null
            ? "bg-white/15 text-white"
            : "text-white/60 hover:text-white/90"
        }`}
      >
        All Floors
      </button>
    </div>
  );
}