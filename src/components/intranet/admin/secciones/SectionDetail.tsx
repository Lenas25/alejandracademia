"use client";

import { IconCircleCheck, IconPencil, IconRotateClockwise2, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import {
  deleteSection,
  fetchSectionById,
} from "@/redux/service/sectionService";
import { finishEnrollment, reopenEnrollment } from "@/redux/service/enrollmentService";
import { Roles } from "@/types/roles";
import CuadrosAsignar from "@/components/intranet/admin/asignar/CuadrosAsignar";
import AsistenciaTab from "./AsistenciaTab";
import DeleteSectionDialog from "./DeleteSectionDialog";
import FinishSectionDialog from "./FinishSectionDialog";
import NotasTab from "./NotasTab";
import PagosTab from "./PagosTab";
import SectionForm from "./SectionForm";
import { useToast } from "@/components/intranet/ui/Toast";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
import { useUnsavedGuard } from "@/components/intranet/ui/UnsavedChanges";

type TabKey = "estudiantes" | "notas" | "pagos" | "asistencia";

const ALL_TABS: { key: TabKey; label: string }[] = [
  { key: "estudiantes", label: "Estudiantes" },
  { key: "notas", label: "Notas" },
  { key: "pagos", label: "Pagos" },
  { key: "asistencia", label: "Asistencia" },
];

const TUTOR_TABS: { key: TabKey; label: string }[] = [
  { key: "notas", label: "Notas" },
];

interface SectionDetailProps {
  sectionId: number;
}

function SectionDetail({ sectionId }: SectionDetailProps) {
  const dispatch = useAppDispatch();
  const { confirmLeave } = useUnsavedGuard();
  const router = useRouter();
  const toast = useToast();
  const section = useAppSelector((state) => state.section?.sectionView);
  const sectionStatus = useAppSelector((state) => state.section?.status);
  const role = useAppSelector((state) => state.user?.userLogin?.role);
  const isAdmin = role === Roles.ADMIN;

  const tabs = useMemo(
    () => (role === Roles.TUTOR ? TUTOR_TABS : ALL_TABS),
    [role],
  );

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0].key);
  const [showEditForm, setShowEditForm] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);
  const isFinished = section?.isActive === false;

  // Tab bar scroll affordance: a right-edge fade while more tabs are hidden,
  // and the active tab kept in view (scrolls the bar only, never the page).
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [hasMoreTabsRight, setHasMoreTabsRight] = useState(false);

  const updateTabFade = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    setHasMoreTabsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (activeEl) {
      const target = activeEl.offsetLeft - (el.clientWidth - activeEl.offsetWidth) / 2;
      el.scrollTo({ left: Math.max(target, 0), behavior: "smooth" });
    }
    updateTabFade();
    window.addEventListener("resize", updateTabFade);
    return () => window.removeEventListener("resize", updateTabFade);
  }, [activeTab, tabs, updateTabFade, section?.id]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    dispatch(fetchSectionById(sectionId));
  }, [dispatch, sectionId]);

  const handleDelete = async () => {
    const resultAction = await dispatch(deleteSection(sectionId));
    if (deleteSection.fulfilled.match(resultAction)) {
      const payload = resultAction.payload;
      if ("error" in payload && payload.error) {
        toast.error(payload.error);
      } else {
        toast.success(payload.message);
        router.push("..");
      }
    } else {
      toast.error("No se pudo eliminar la sección. Inténtalo de nuevo.");
    }
  };

  const handleFinishToggle = async () => {
    setFinishLoading(true);
    try {
    // Both thunks always resolve — they catch and return a
    // `{ message, error? }` payload instead of calling rejectWithValue —
    // so the outcome is read from `.payload`, not from `.fulfilled.match`.
    const thunk = isFinished ? reopenEnrollment : finishEnrollment;
    const resultAction = await dispatch(thunk({ courseId: sectionId }));
    const payload = resultAction.payload as { message?: string; error?: string };
    if (payload.error) {
      toast.error(`Error al ${isFinished ? "reabrir" : "finalizar"} la sección: ${payload.error}`);
    } else {
      toast.success(payload.message ?? (isFinished ? "Sección reabierta" : "Sección finalizada"));
      dispatch(fetchSectionById(sectionId));
    }
    } finally {
      setFinishLoading(false);
    }
  };

  if (!section || section.id !== sectionId) {
    return (
      <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10">
        {sectionStatus === "loading" ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg text-darkpink" />
          </div>
        ) : (
          <p className="text-center py-10 text-gray-400">
            No se encontró la sección
          </p>
        )}
      </div>
    );
  }

  if (showEditForm) {
    return (
      <SectionForm
        selectedSection={section}
        onCancel={() => setShowEditForm(false)}
        onSuccess={(successMessage) => {
          toast.success(successMessage);
          setShowEditForm(false);
        }}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 mb-5 bg-black rounded-lg shadow relative p-4 sm:p-6 md:p-8">
        <div className="text-sm text-gray-400 min-w-0 break-words">
          <Link href=".." className="hover:text-white">
            Secciones
          </Link>{" "}
          / {section.course?.name}
        </div>
        <div className="flex gap-5 items-center justify-between flex-wrap">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <h1 className="text-xl sm:text-2xl font-medium text-white min-w-0 break-words">{section.name}</h1>
            {isFinished && (
              <span className="badge bg-yellow text-black border-none font-semibold">
                Finalizada
              </span>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-wrap max-w-full">
              <LoadingButton
                type="button"
                onClick={() =>
                  (
                    document.getElementById(
                      `finish_section_${section.id}`,
                    ) as HTMLDialogElement
                  )?.showModal()
                }
                className="btn btn-ghost btn-sm min-h-10 bg-white text-black hover:bg-darkpink hover:text-white disabled:bg-gray-300 disabled:text-gray-500"
                loading={finishLoading}
                loadingText={isFinished ? "Reabriendo…" : "Finalizando…"}
              >
                {isFinished ? (
                  <>
                    <IconRotateClockwise2 size={16} /> Reabrir sección
                  </>
                ) : (
                  <>
                    <IconCircleCheck size={16} /> Finalizar sección
                  </>
                )}
              </LoadingButton>
              <button
                type="button"
                onClick={() => confirmLeave(() => setShowEditForm(true))}
                className="btn btn-ghost btn-sm min-h-10 bg-white text-black hover:bg-darkpink hover:text-white"
              >
                <IconPencil size={16} /> Editar
              </button>
              <button
                type="button"
                onClick={() =>
                  (
                    document.getElementById(
                      `delete_section_${section.id}`,
                    ) as HTMLDialogElement
                  )?.showModal()
                }
                className="btn btn-ghost btn-sm min-h-10 bg-white text-black hover:bg-error hover:text-white"
              >
                <IconTrash size={16} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10">
        {/* Horizontally scrollable tab bar for narrow screens (~360-430px):
            reuses the `.table-scroll` convention (themed pink scrollbar)
            instead of a bare `overflow-x-auto` so the scrollability itself
            is visible — a plain hidden-scrollbar overflow made the last tab
            ("Asistencia") read as clipped/cut off on a real phone rather
            than "swipe to see more". `w-max` + `whitespace-nowrap` keep the
            tab row on one line so it never wraps and breaks the boxed
            look; `pr-2` gives the last tab breathing room at the scroll
            end instead of touching the container edge. */}
        <div className="relative mb-6 max-w-full">
          <div
            ref={tabScrollRef}
            onScroll={updateTabFade}
            className="table-scroll max-w-full snap-x snap-proximity"
          >
          <div role="tablist" className="tabs tabs-boxed w-max gap-1 bg-black pr-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`tab h-10 min-h-10 snap-start whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "!bg-darkpink !text-white"
                    : "text-gray-300 hover:!text-white"
                }`}
                onClick={() => {
                  if (tab.key !== activeTab) {
                    confirmLeave(() => setActiveTab(tab.key));
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          </div>
          {/* Right-edge fade: hints that more tabs are off-screen. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-lg bg-gradient-to-r from-transparent to-black transition-opacity ${
              hasMoreTabsRight ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {activeTab === "estudiantes" && (
          <CuadrosAsignar selectedSection={section} />
        )}
        {activeTab === "notas" && <NotasTab selectedSection={section} />}
        {activeTab === "pagos" && <PagosTab selectedSection={section} />}
        {activeTab === "asistencia" && (
          <AsistenciaTab selectedSection={section} />
        )}
      </div>

      {isAdmin && (
        <FinishSectionDialog
          section={section}
          mode={isFinished ? "reopen" : "finish"}
          onConfirm={handleFinishToggle}
          loading={finishLoading}
        />
      )}
      <DeleteSectionDialog section={section} onConfirm={handleDelete} />
    </>
  );
}

export default SectionDetail;
