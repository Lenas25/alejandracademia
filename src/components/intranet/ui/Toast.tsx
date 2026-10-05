"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { IconAlertCircle, IconCircleCheck, IconInfoCircle, IconX } from "@tabler/icons-react";

type Kind = "success" | "error" | "info";
interface ToastItem { id: number; kind: Kind; message: string; bump: number }
interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

const DURATION: Record<Kind, number> = { success: 3000, info: 4000, error: 6000 };
const MAX_VISIBLE = 3;
const STYLE: Record<Kind, { border: string; icon: string; Icon: typeof IconCircleCheck }> = {
  success: { border: "border-l-emerald-500", icon: "text-emerald-600", Icon: IconCircleCheck },
  info: { border: "border-l-sky-500", icon: "text-sky-600", Icon: IconInfoCircle },
  error: { border: "border-l-red-500", icon: "text-red-600", Icon: IconAlertCircle },
};

const fallback: ToastApi = {
  success: () => warn(), error: () => warn(), info: () => warn(), dismiss: () => {},
};
function warn() {
  if (process.env.NODE_ENV !== "production") console.warn("useToast() used outside <ToastProvider>");
}

const ToastContext = createContext<ToastApi>(fallback);
export const useToast = () => useContext(ToastContext);

function ToastView({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onDismiss(toast.id), DURATION[toast.kind]);
  }, [onDismiss, toast.id, toast.kind]);
  const stop = useCallback(() => { if (timer.current) clearTimeout(timer.current); }, []);
  // `toast.bump` changes on a deduped repeat, restarting the timer.
  useEffect(() => { start(); return stop; }, [start, stop, toast.bump]);

  const { border, icon, Icon } = STYLE[toast.kind];
  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
      onMouseEnter={stop} onMouseLeave={start} onFocus={stop} onBlur={start}
      className={`pointer-events-auto flex items-center gap-3 min-h-12 rounded-xl border-l-4 ${border} bg-white py-2 pl-3 pr-1 text-neutral-900 shadow-xl ring-1 ring-black/10`}
    >
      <Icon size={22} className={`shrink-0 ${icon}`} aria-hidden="true" />
      <span className="flex-1 min-w-0 break-words whitespace-pre-line text-sm font-medium leading-snug">{toast.message}</span>
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => onDismiss(toast.id)}
        className="btn btn-ghost btn-sm size-10 min-h-10 p-0 shrink-0 text-neutral-500"
      >
        <IconX size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const layer = useRef<HTMLDivElement>(null);

  // Open dialogs (showModal) live in the browser top layer, where z-index cannot win.
  // Promote the toast container to the top layer too, and re-show it on each change so it stays above.
  useEffect(() => {
    const el = layer.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (el.matches(":popover-open")) el.hidePopover();
      if (toasts.length > 0) el.showPopover();
    } catch { /* popover unsupported: fixed + z-index fallback applies */ }
  }, [toasts]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Kind, message: string) => {
    setToasts((t) => {
      const last = t[t.length - 1];
      if (last && last.kind === kind && last.message === message) {
        // Dedupe consecutive repeats, but bump so the toast's timer restarts.
        return [...t.slice(0, -1), { ...last, bump: last.bump + 1 }];
      }
      return [...t, { id: nextId.current++, kind, message, bump: 0 }].slice(-MAX_VISIBLE);
    });
  }, []);

  const api = useMemo<ToastApi>(() => ({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        ref={layer}
        popover="manual"
        className="pointer-events-none fixed z-[1100] m-0 h-auto w-auto overflow-visible border-0 bg-transparent p-0 top-[max(0.75rem,env(safe-area-inset-top))] bottom-auto left-16 right-3 md:left-auto md:right-6 md:w-full md:max-w-sm flex flex-col gap-2"
      >
        {toasts.map((t) => <ToastView key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}
