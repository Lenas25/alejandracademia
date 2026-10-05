"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Kind = "success" | "error" | "info";
interface ToastItem { id: number; kind: Kind; message: string }
interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

const DURATION: Record<Kind, number> = { success: 3000, info: 4000, error: 6000 };
const MAX_VISIBLE = 3;
const STYLE: Record<Kind, string> = {
  success: "alert-success",
  info: "alert-info",
  error: "alert-error",
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
    timer.current = setTimeout(() => onDismiss(toast.id), DURATION[toast.kind]);
  }, [onDismiss, toast.id, toast.kind]);
  const stop = useCallback(() => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { start(); return stop; }, [start, stop]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
      onMouseEnter={stop} onMouseLeave={start} onFocus={stop} onBlur={start}
      className={`alert ${STYLE[toast.kind]} pointer-events-auto shadow-lg flex items-start gap-2 py-2 pr-1`}
    >
      <span className="flex-1 min-w-0 break-words whitespace-pre-line text-sm">{toast.message}</span>
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => onDismiss(toast.id)}
        className="btn btn-ghost btn-sm size-10 min-h-10 p-0 shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Kind, message: string) => {
    setToasts((t) => {
      const last = t[t.length - 1];
      if (last && last.kind === kind && last.message === message) return t; // dedupe consecutive
      return [...t, { id: nextId.current++, kind, message }].slice(-MAX_VISIBLE);
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
      <div className="pointer-events-none fixed z-[1100] top-[max(0.75rem,env(safe-area-inset-top))] left-16 right-3 md:left-auto md:right-6 md:max-w-sm md:w-full flex flex-col gap-2">
        {toasts.map((t) => <ToastView key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}
