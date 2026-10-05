"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { IconAlertTriangle } from "@tabler/icons-react";

// Unsaved-changes guard.
//
// Components report their dirty state with `useUnsavedChanges(key, dirty,
// label)`. The provider aggregates those flags and:
//  - exposes `confirmLeave(action)` (runs `action` now if clean, otherwise
//    asks the user first),
//  - warns on reload / tab close (`beforeunload`) while dirty,
//  - intercepts same-origin <a> clicks while dirty and routes them through
//    `confirmLeave`.
// Browser Back is intentionally NOT intercepted (see note near the listeners).

interface UnsavedStore {
  set: (key: string, label?: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  size: () => number;
  labels: () => string[];
  subscribe: (listener: () => void) => () => void;
  // Primitive string so useSyncExternalStore only re-renders on real changes.
  getSnapshot: () => string;
}

function createStore(): UnsavedStore {
  const entries = new Map<string, string | undefined>();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const labels = () => {
    const out: string[] = [];
    entries.forEach((label) => {
      if (label && !out.includes(label)) out.push(label);
    });
    return out;
  };

  return {
    set(key, label) {
      if (entries.has(key) && entries.get(key) === label) return;
      entries.set(key, label);
      emit();
    },
    remove(key) {
      if (entries.delete(key)) emit();
    },
    clear() {
      if (entries.size === 0) return;
      entries.clear();
      emit();
    },
    size: () => entries.size,
    labels,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => JSON.stringify([entries.size, ...labels()]),
  };
}

interface UnsavedChangesState {
  /** True while at least one registered source is dirty. */
  isDirty: boolean;
  /** Unique labels of the dirty sources (in registration order). */
  dirtyLabels: string[];
  /** Runs `action` now when clean; otherwise asks for confirmation first. */
  confirmLeave: (action: () => void) => void;
}

interface UnsavedApi {
  register: (key: string, label?: string) => void;
  unregister: (key: string) => void;
}

// Outside a provider the guard is a no-op, so tabs stay usable standalone.
const noopState: UnsavedChangesState = {
  isDirty: false,
  dirtyLabels: [],
  confirmLeave: (action) => action(),
};
const noopApi: UnsavedApi = { register: () => {}, unregister: () => {} };

// Two contexts: the registration API is stable (tabs never re-render because
// of it); the aggregate state changes only when the aggregate changes.
const ApiContext = createContext<UnsavedApi>(noopApi);
const StateContext = createContext<UnsavedChangesState>(noopState);

/** Aggregate state + `confirmLeave`. */
export const useUnsavedGuard = () => useContext(StateContext);

/**
 * Registers `dirty` for `key` while the calling component is mounted.
 * The flag is removed when `dirty` turns false or the component unmounts.
 */
export function useUnsavedChanges(key: string, dirty: boolean, label?: string) {
  const { register, unregister } = useContext(ApiContext);
  useEffect(() => {
    if (!dirty) return;
    register(key, label);
    return () => unregister(key);
  }, [register, unregister, key, dirty, label]);
}

function buildMessage(labels: string[]): string {
  const where = labels.length > 0 ? ` en: ${labels.join(", ")}` : "";
  return `Tienes cambios sin guardar${where}. Si sales, se perderán.`;
}

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [store] = useState(createStore);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, () => "[0]");

  const { isDirty, dirtyLabels } = useMemo(() => {
    const [count, ...labels] = JSON.parse(snapshot) as [number, ...string[]];
    return { isDirty: count > 0, dirtyLabels: labels };
  }, [snapshot]);

  const api = useMemo<UnsavedApi>(
    () => ({ register: store.set, unregister: store.remove }),
    [store],
  );

  // Pending confirmation. The action lives in a ref (functions in state are
  // error-prone); `dialog` holds the labels shown in the message.
  const pendingAction = useRef<(() => void) | null>(null);
  const [dialog, setDialog] = useState<{ labels: string[] } | null>(null);

  const confirmLeave = useCallback(
    (action: () => void) => {
      // Read the store (not render state) so async callers see current dirtiness.
      if (store.size() === 0) {
        action();
        return;
      }
      pendingAction.current = action;
      setDialog({ labels: store.labels() });
    },
    [store],
  );

  const state = useMemo<UnsavedChangesState>(
    () => ({ isDirty, dirtyLabels, confirmLeave }),
    [isDirty, dirtyLabels, confirmLeave],
  );

  // Reload / close tab / external navigation.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // required by some browsers to show the native prompt
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // In-app link clicks (sidebar, breadcrumbs, ...). Capture phase on document
  // runs before React's root listener, so next/link never sees the click.
  //
  // Browser Back/Forward is deliberately not guarded: in the App Router the
  // only way to veto popstate is to push sentinel history entries and fight
  // the router's own history state, which is fragile. `beforeunload` still
  // covers reload/close, and in-app links + tab switches are confirmed.
  useEffect(() => {
    if (!isDirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;
      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Hash-only or same-URL links do not unmount anything.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      e.stopPropagation();
      const href = `${url.pathname}${url.search}${url.hash}`;
      confirmLeave(() => router.push(href));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty, confirmLeave, router]);

  // ----- Confirmation dialog -----
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (dialog && !el.open) {
      el.showModal();
      stayRef.current?.focus();
    } else if (!dialog && el.open) {
      el.close();
    }
  }, [dialog]);

  // Esc / backdrop / "Seguir editando": stay on the page.
  const stay = useCallback(() => {
    pendingAction.current = null;
    setDialog(null);
  }, []);

  const discard = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    // Flags are tab-local and vanish on unmount; clear now so nothing
    // (beforeunload, link guard) keeps firing while the action runs.
    store.clear();
    setDialog(null);
    action?.();
  }, [store]);

  return (
    <ApiContext.Provider value={api}>
      <StateContext.Provider value={state}>
        {children}
        <dialog
          ref={dialogRef}
          role="alertdialog"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="modal modal-bottom sm:modal-middle backdrop-blur-sm"
          onClose={stay}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-box text-white max-h-[90dvh] overflow-y-auto overflow-x-clip pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
            <div className="flex items-center gap-3">
              <IconAlertTriangle className="shrink-0 text-yellow" aria-hidden="true" />
              <h3 id={titleId} className="font-semibold text-xl sm:text-2xl">
                Cambios sin guardar
              </h3>
            </div>
            <p id={descId} className="py-4 text-base">
              {buildMessage(dialog?.labels ?? [])}
            </p>
            <div className="mt-2 flex w-full flex-wrap justify-end gap-3">
              <button
                ref={stayRef}
                type="button"
                onClick={stay}
                className="btn btn-sm h-10 min-h-10"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={discard}
                className="btn btn-sm h-10 min-h-10 border-none bg-darkpink text-white hover:bg-black"
              >
                Descartar y salir
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="submit" tabIndex={-1} aria-label="Seguir editando">
              close
            </button>
          </form>
        </dialog>
      </StateContext.Provider>
    </ApiContext.Provider>
  );
}
