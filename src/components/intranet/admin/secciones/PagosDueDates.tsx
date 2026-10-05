"use client";

import { memo, useEffect, useRef, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

interface CuotaDueDateInputProps {
  installmentNumber: number;
  storedValue: string | null;
  // Resolves true when the backend accepted the change.
  onCommit: (installmentNumber: number, dueDate: string | null) => Promise<boolean>;
}

// A "YYYY-MM-DD" string that is a real calendar date within a sane range.
// Guards against transient values while the user types the year segment.
function isCompleteValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y < 2000 || y > 2100) return false;
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

// One due-date field. Keeps a local draft while typing and only commits on
// blur / Enter when the draft is a complete valid date (or cleared) and
// differs from the stored value.
const CuotaDueDateInput = memo(function CuotaDueDateInput({
  installmentNumber,
  storedValue,
  onCommit,
}: CuotaDueDateInputProps) {
  const stored = storedValue ?? "";
  const [draft, setDraft] = useState<string>(stored);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync the draft whenever the store value changes (after save/refetch).
  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const commit = async () => {
    if (saveState === "saving") return;
    if (draft === stored) return;
    if (draft !== "" && !isCompleteValidDate(draft)) {
      setDraft(stored);
      return;
    }
    setSaveState("saving");
    const ok = await onCommit(installmentNumber, draft === "" ? null : draft);
    setSaveState(ok ? "saved" : "error");
    if (!ok) setDraft(stored);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (ok) {
      resetTimer.current = setTimeout(() => setSaveState("idle"), 2000);
    }
  };

  const dirty = draft !== stored && saveState !== "saving";

  return (
    <label className="flex flex-col gap-1 rounded-md border border-grey bg-white px-3 py-2">
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-black">
        Cuota {installmentNumber}
        <span
          className="text-xs font-normal min-h-4"
          role="status"
          aria-live="polite"
        >
          {saveState === "saving" && (
            <span className="text-gray-500">Guardando…</span>
          )}
          {saveState === "saved" && (
            <span className="text-emerald-700">Guardado</span>
          )}
          {saveState === "error" && (
            <span className="text-error">Error al guardar</span>
          )}
          {saveState === "idle" && dirty && (
            <span className="text-gray-500">Sin guardar</span>
          )}
        </span>
      </span>
      <input
        type="date"
        value={draft}
        readOnly={saveState === "saving"}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        className="input input-bordered h-10 w-full min-w-[9.5rem] bg-white text-black [color-scheme:light] focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink"
      />
    </label>
  );
});

interface DueDatesPanelProps {
  items: { installmentNumber: number; dueDate: string | null }[];
  onCommit: CuotaDueDateInputProps["onCommit"];
}

export function DueDatesPanel({ items, onCommit }: DueDatesPanelProps) {
  const defined = items.filter((i) => i.dueDate).length;
  return (
    <details className="group rounded-lg border border-grey bg-white">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-medium text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink [&::-webkit-details-marker]:hidden">
        <span>
          Vencimientos por cuota
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({defined} de {items.length} definidas)
          </span>
        </span>
        <span
          aria-hidden
          className="text-gray-500 transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="grid grid-cols-1 gap-3 border-t border-grey p-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ installmentNumber, dueDate }) => (
          <CuotaDueDateInput
            key={installmentNumber}
            installmentNumber={installmentNumber}
            storedValue={dueDate}
            onCommit={onCommit}
          />
        ))}
      </div>
    </details>
  );
}
