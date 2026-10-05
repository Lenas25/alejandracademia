"use client";

import { Section } from "@/types/section";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import {
  fetchEnrollment,
  updateEnrollment,
} from "@/redux/service/enrollmentService";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
import { memo, useCallback, useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { fetchUsers } from "@/redux/service/userService";
import { Roles } from "@/types/roles";
import { User } from "@/types/user";
import { IconUserPlus, IconX, IconSearch } from "@tabler/icons-react";
import TabHeader from "@/components/intranet/admin/secciones/TabHeader";

interface CuadrosAsignarProps {
  selectedSection: Section | null;
}

type PanelKind = "available" | "assigned";

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Mirrors Tailwind's `lg` breakpoint so only one layout is mounted at a time
// (avoids duplicate inputs/ids and double rendering of long lists).
function useIsLg(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(min-width: 1024px)");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

function matchesTerm(user: User, term: string): boolean {
  if (!term) return true;
  return (
    !!user.name?.toLowerCase().includes(term) ||
    !!user.lastName?.toLowerCase().includes(term) ||
    user.id.toString().toLowerCase().includes(term)
  );
}

interface UserRowProps {
  user: User;
  kind: PanelKind;
  onAction: (user: User) => void;
}

const UserRow = memo(function UserRow({ user, kind, onAction }: UserRowProps) {
  const fullName = `${user.name ?? ""} ${user.lastName ?? ""}`.trim();
  const isAvailable = kind === "available";
  return (
    <li>
      <button
        type="button"
        onClick={() => onAction(user)}
        aria-label={`${isAvailable ? "Asignar a" : "Quitar a"} ${fullName}`}
        className="w-full min-h-12 border border-grey rounded-lg p-3 bg-white hover:bg-lightpink/40 transition-colors flex justify-between items-center gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkpink focus-visible:ring-offset-1"
      >
        <span className="min-w-0 flex flex-col">
          <span className="font-medium break-words text-black">{fullName}</span>
          <span className="text-xs text-gray-500 break-all">{user.id}</span>
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center">
          {isAvailable ? (
            <IconUserPlus className="text-gray-600" aria-hidden="true" />
          ) : (
            <IconX className="text-red-500" size={18} aria-hidden="true" />
          )}
        </span>
      </button>
    </li>
  );
});

interface UserPanelProps {
  kind: PanelKind;
  users: User[];
  totalCount: number;
  label: string;
  emptyText: string;
  noResultsText: string;
  onAction: (user: User) => void;
  scrollable: boolean;
}

function UserPanel({
  kind,
  users,
  totalCount,
  label,
  emptyText,
  noResultsText,
  onAction,
  scrollable,
}: UserPanelProps) {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const term = useDebouncedValue(
    search.trim().toLowerCase(),
    SEARCH_DEBOUNCE_MS,
  );

  const filtered = useMemo(
    () => (term ? users.filter((u) => matchesTerm(u, term)) : users),
    [users, term],
  );

  // Reset pagination whenever the query changes.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [term]);

  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;
  const inputId = useId();

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-500">
          {label} ({totalCount})
        </label>
        <div className="relative">
          <input
            id={inputId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar estudiante..."
            aria-label={`Buscar en ${label.toLowerCase()}`}
            className="input input-bordered w-full bg-white text-black pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          <IconSearch
            size={20}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      <div
        className={
          scrollable
            ? "lg:max-h-[calc(100dvh-22rem)] lg:min-h-48 lg:overflow-y-auto overscroll-contain lg:pr-1"
            : ""
        }
      >
        {filtered.length > 0 ? (
          <>
            <ul className="flex flex-col gap-2">
              {shown.map((user) => (
                <UserRow
                  key={`${kind}-${user.id}`}
                  user={user}
                  kind={kind}
                  onAction={onAction}
                />
              ))}
            </ul>
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="btn btn-sm btn-outline w-full mt-3 min-h-10"
              >
                Mostrar más ({remaining})
              </button>
            )}
          </>
        ) : (
          <p className="text-center py-10 text-gray-400">
            {totalCount === 0 ? emptyText : noResultsText}
          </p>
        )}
      </div>
    </div>
  );
}

function CuadrosAsignar({ selectedSection }: CuadrosAsignarProps) {
  const dispatch = useAppDispatch();

  const allEnrollments = useAppSelector(
    (state) => state.enrollment.enrollments,
  );
  const allUsers = useAppSelector((state) => state.user.users);
  const enrollmentStatus = useAppSelector((state) => state.enrollment.status);
  const userStatus = useAppSelector((state) => state.user.status);

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  // Ids of the last saved/loaded assignment, used to compute pending changes.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<PanelKind>("available");
  const [saving, setSaving] = useState(false);
  const isLg = useIsLg();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSection?.id) {
      // enrollmentService's `courseId` param name is unchanged: the
      // `/enrollment/course/:id` route path was kept as-is, only its
      // meaning shifted to a section id (see enrollmentService.ts).
      dispatch(fetchEnrollment({ courseId: selectedSection.id }));
    }
    // Reset on section change (or clear) only; keyed on the id so a parent
    // refresh of the same section never wipes unsaved edits.
    setSelectedUsers([]);
    setSavedIds(new Set());
  }, [dispatch, selectedSection?.id]);

  const sectionId = selectedSection?.id;

  const enrolledUsersFromBackend = useMemo<User[]>(() => {
    if (!sectionId) return [];
    return allEnrollments
      .filter((en) => en.section && en.active && en.section.id === sectionId)
      .flatMap((en) => en.user)
      .filter((user): user is User => user != null && "id" in user);
  }, [allEnrollments, sectionId]);

  useEffect(() => {
    setSelectedUsers(enrolledUsersFromBackend);
    setSavedIds(new Set(enrolledUsersFromBackend.map((u) => String(u.id))));
  }, [enrolledUsersFromBackend]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const selectedIds = useMemo(
    () => new Set(selectedUsers.map((u) => String(u.id))),
    [selectedUsers],
  );

  const addedCount = useMemo(() => {
    let n = 0;
    selectedIds.forEach((id) => {
      if (!savedIds.has(id)) n++;
    });
    return n;
  }, [selectedIds, savedIds]);

  const removedCount = useMemo(() => {
    let n = 0;
    savedIds.forEach((id) => {
      if (!selectedIds.has(id)) n++;
    });
    return n;
  }, [selectedIds, savedIds]);

  const hasChanges = addedCount > 0 || removedCount > 0;

  const handleAddUser = useCallback((userToAdd: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === userToAdd.id) ? prev : [...prev, userToAdd],
    );
  }, []);

  const handleRemoveUser = useCallback((userToRemove: User) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userToRemove.id));
  }, []);

  const handleSubmit = async () => {
    if (selectedSection && !saving) {
      setSaving(true);
      try {
      const enrollmentData = {
        users: selectedUsers.map((user) => ({ id: String(user.id) })),
      };
      const resultAction = await dispatch(
        updateEnrollment({
          courseId: selectedSection.id,
          data: enrollmentData,
        }),
      );
      // Note: `courseId` here is the enrollmentService thunk's param name,
      // unchanged for the same reason as fetchEnrollment above.
      // The thunk catches API errors and resolves with an `error` field, so
      // `fulfilled` alone is not proof the save succeeded.
      if (
        updateEnrollment.fulfilled.match(resultAction) &&
        !("error" in resultAction.payload)
      ) {
        setSavedIds(new Set(selectedUsers.map((u) => String(u.id))));
        setMessage(
          resultAction.payload.message || "Cambios guardados con éxito",
        );
      } else if (updateEnrollment.fulfilled.match(resultAction)) {
        setMessage(`Error: ${resultAction.payload.message}`);
      }
      } finally {
        setSaving(false);
      }
    }
  };

  const availableUsers = useMemo(
    () =>
      allUsers.filter(
        (user) =>
          user.role === Roles.ALUMNO && !selectedIds.has(String(user.id)),
      ),
    [allUsers, selectedIds],
  );

  const tabs: { key: PanelKind; label: string; count: number }[] = [
    { key: "available", label: "Disponibles", count: availableUsers.length },
    { key: "assigned", label: "Asignados", count: selectedUsers.length },
  ];

  const availablePanel = (scrollable: boolean) => (
    <UserPanel
      kind="available"
      users={availableUsers}
      totalCount={availableUsers.length}
      label="Disponibles"
      emptyText="No hay estudiantes disponibles."
      noResultsText="No hay estudiantes que coincidan."
      onAction={handleAddUser}
      scrollable={scrollable}
    />
  );
  const assignedPanel = (scrollable: boolean) => (
    <UserPanel
      kind="assigned"
      users={selectedUsers}
      totalCount={selectedUsers.length}
      label="Asignados"
      emptyText="Aún no hay estudiantes asignados."
      noResultsText="No hay estudiantes que coincidan."
      onAction={handleRemoveUser}
      scrollable={scrollable}
    />
  );

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <TabHeader title="Asignar Estudiantes" />

      {!selectedSection ? (
        <div className="flex justify-center items-center py-10">
          <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
            Seleccione un curso para asignar estudiantes
          </span>
        </div>
      ) : enrollmentStatus === "loading" || userStatus === "loading" ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-darkpink" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 min-w-0">
          <p className="text-sm text-gray-500 break-words">
            {selectedSection.name}
          </p>

          {message && (
            <div
              role="status"
              className={`alert ${
                message.includes("Error") ? "alert-error" : "alert-success"
              } text-white`}
            >
              {message}
            </div>
          )}

          {!isLg ? (
            <div className="flex flex-col gap-4">
              <div
                role="tablist"
                aria-label="Listas de estudiantes"
                className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"
              >
                {tabs.map((tab) => {
                  const selected = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      id={`tab-${tab.key}`}
                      aria-selected={selected}
                      aria-controls={`panel-${tab.key}`}
                      onClick={() => setActiveTab(tab.key)}
                      className={`min-h-11 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkpink ${
                        selected
                          ? "bg-white text-black shadow-sm"
                          : "text-gray-500 hover:text-black"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>
              <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
              >
                {activeTab === "available"
                  ? availablePanel(false)
                  : assignedPanel(false)}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 items-start">
              {availablePanel(true)}
              {assignedPanel(true)}
            </div>
          )}

          {/* Sticky save bar. Sits in normal flow width (no fixed), so it never
              overlaps the desktop sidebar rail or the mobile hamburger. */}
          <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
            <div
              className="flex flex-wrap items-center gap-2 text-sm"
              aria-live="polite"
            >
              {hasChanges ? (
                <>
                  {addedCount > 0 && (
                    <span className="badge badge-success badge-outline h-auto py-1">
                      +{addedCount} agregados
                    </span>
                  )}
                  {removedCount > 0 && (
                    <span className="badge badge-error badge-outline h-auto py-1">
                      −{removedCount} quitados
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500">Sin cambios pendientes</span>
              )}
            </div>
            <LoadingButton
              type="button"
              onClick={handleSubmit}
              loading={saving}
              loadingText="Guardando…"
              disabled={!hasChanges}
              className="btn btn-sm min-h-10 bg-darkpink text-white border-none hover:bg-black disabled:bg-gray-200 disabled:text-gray-400"
            >
              Guardar
            </LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default CuadrosAsignar;
