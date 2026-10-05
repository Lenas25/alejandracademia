"use client";

import { AttendanceDayFlag } from "@/types/attendance";
import { useEffect, useState } from "react";

// `date` is a raw YYYY-MM-DD string: format by string split, never `new Date()`.
export function formatDayDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

interface AsistenciaGridProps {
  days: AttendanceDayFlag[];
  resetKey: string;
}

// One square per class day (data model only has present/absent). Squares are
// real buttons: keyboard focusable, with aria-label + title, and the selected
// day is spelled out in a visible caption below the grid.
export function AsistenciaGrid({ days, resetKey }: AsistenciaGridProps) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [resetKey]);

  const selectedDay = days.find((d) => d.date === selected) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
        {days.map((day) => {
          const label = `${formatDayDate(day.date)}: ${day.present ? "Presente" : "Ausente"}`;
          const isSelected = day.date === selected;
          return (
            <button
              key={day.date}
              type="button"
              aria-label={label}
              aria-pressed={isSelected}
              title={label}
              onClick={() => setSelected(isSelected ? null : day.date)}
              className={`flex h-10 w-full flex-col items-center justify-center rounded-md text-[11px] font-medium leading-none text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                day.present ? "bg-emerald-700 hover:bg-emerald-800" : "bg-red-700 hover:bg-red-800"
              } ${isSelected ? "ring-2 ring-black ring-offset-1" : ""}`}>
              <span aria-hidden>{day.present ? "✓" : "✕"}</span>
              <span>{day.date.slice(8, 10)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-emerald-700 text-[10px] leading-none text-white" aria-hidden>✓</span> Presente
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-red-700 text-[10px] leading-none text-white" aria-hidden>✕</span> Ausente
        </span>
      </div>

      <p className="min-h-5 text-sm text-gray-700" aria-live="polite">
        {selectedDay
          ? `${formatDayDate(selectedDay.date)} · ${selectedDay.present ? "Presente" : "Ausente"}`
          : "Toca un día para ver el detalle."}
      </p>
    </div>
  );
}
