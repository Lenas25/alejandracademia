"use client";

import { IconCircleCheck, IconPencil, IconRotateClockwise2, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  const router = useRouter();
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
  const [message, setMessage] = useState<string>("");
  const [finishLoading, setFinishLoading] = useState(false);
  const isFinished = section?.isActive === false;

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    dispatch(fetchSectionById(sectionId));
  }, [dispatch, sectionId]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDelete = async () => {
    const resultAction = await dispatch(deleteSection(sectionId));
    if (deleteSection.fulfilled.match(resultAction)) {
      const payload = resultAction.payload;
      if ("error" in payload && payload.error) {
        setMessage(`Error al eliminar la sección: ${payload.error}`);
      } else {
        router.push("..");
      }
    }
  };

  const handleFinishToggle = async () => {
    setFinishLoading(true);
    // Both thunks always resolve — they catch and return a
    // `{ message, error? }` payload instead of calling rejectWithValue —
    // so the outcome is read from `.payload`, not from `.fulfilled.match`.
    const thunk = isFinished ? reopenEnrollment : finishEnrollment;
    const resultAction = await dispatch(thunk({ courseId: sectionId }));
    const payload = resultAction.payload as { message?: string; error?: string };
    if (payload.error) {
      setMessage(`Error al ${isFinished ? "reabrir" : "finalizar"} la sección: ${payload.error}`);
    } else {
      setMessage(payload.message ?? (isFinished ? "Sección reabierta" : "Sección finalizada"));
      dispatch(fetchSectionById(sectionId));
    }
    setFinishLoading(false);
  };

  if (!section || section.id !== sectionId) {
    return (
      <div className="overflow-hidden bg-white rounded-lg shadow relative p-6 md:p-10">
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
          setMessage(successMessage);
          setShowEditForm(false);
        }}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 mb-5 bg-black rounded-lg shadow relative p-6 md:p-8">
        <div className="text-sm text-gray-400">
          <Link href=".." className="hover:text-white">
            Secciones
          </Link>{" "}
          / {section.course?.name}
        </div>
        <div className="flex gap-5 items-center justify-between flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-medium text-white">{section.name}</h1>
            {isFinished && (
              <span className="badge bg-yellow text-black border-none font-semibold">
                Finalizada
              </span>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  (
                    document.getElementById(
                      `finish_section_${section.id}`,
                    ) as HTMLDialogElement
                  )?.showModal()
                }
                className="btn btn-ghost btn-sm bg-white text-black hover:bg-darkpink hover:text-white disabled:bg-gray-300 disabled:text-gray-500"
                disabled={finishLoading}
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
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(true)}
                className="btn btn-ghost btn-sm bg-white text-black hover:bg-darkpink hover:text-white"
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
                className="btn btn-ghost btn-sm bg-white text-black hover:bg-error hover:text-white"
              >
                <IconTrash size={16} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`alert my-5 text-white ${message.includes("Error") ? "alert-error" : "alert-success"}`}
        >
          {message}
        </div>
      )}

      <div className="overflow-hidden bg-white rounded-lg shadow relative p-6 md:p-10">
        {/* Horizontally scrollable tab bar for narrow screens (~360-430px):
            reuses the `.table-scroll` convention (themed pink scrollbar)
            instead of a bare `overflow-x-auto` so the scrollability itself
            is visible — a plain hidden-scrollbar overflow made the last tab
            ("Asistencia") read as clipped/cut off on a real phone rather
            than "swipe to see more". `w-max` + `whitespace-nowrap` keep the
            tab row on one line so it never wraps and breaks the boxed
            look; `pr-2` gives the last tab breathing room at the scroll
            end instead of touching the container edge. */}
        <div className="mb-6 max-w-full table-scroll">
          <div role="tablist" className="tabs tabs-boxed w-max gap-1 bg-black pr-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`tab whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "!bg-darkpink !text-white"
                    : "text-gray-300 hover:!text-white"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
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
