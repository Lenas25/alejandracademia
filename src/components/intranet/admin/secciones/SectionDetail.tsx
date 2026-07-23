"use client";

import { IconPencil, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { deleteSection, fetchSectionById } from "@/redux/service/sectionService";
import CuadrosAsignar from "@/components/intranet/admin/asignar/CuadrosAsignar";
import DeleteSectionDialog from "./DeleteSectionDialog";
import PagosTab from "./PagosTab";
import SectionForm from "./SectionForm";

type TabKey = "estudiantes" | "pagos" | "asistencia";

const TABS: { key: TabKey; label: string }[] = [
  { key: "estudiantes", label: "Estudiantes" },
  { key: "pagos", label: "Pagos" },
  { key: "asistencia", label: "Asistencia" },
];

interface SectionDetailProps {
  sectionId: number;
}

function SectionDetail({ sectionId }: SectionDetailProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const section = useAppSelector((state) => state.section?.sectionView);
  const sectionStatus = useAppSelector((state) => state.section?.status);

  const [activeTab, setActiveTab] = useState<TabKey>("estudiantes");
  const [showEditForm, setShowEditForm] = useState(false);
  const [message, setMessage] = useState<string>("");

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

  if (!section || section.id !== sectionId) {
    return (
      <div className="overflow-hidden bg-white rounded-lg shadow relative p-6 md:p-10">
        {sectionStatus === "loading" ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg text-darkpink" />
          </div>
        ) : (
          <p className="text-center py-10 text-gray-400">No se encontró la sección</p>
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
          / {section.course?.name} · {section.name}
        </div>
        <div className="flex gap-5 items-center justify-between flex-wrap">
          <h1 className="text-2xl font-medium text-white">{section.name}</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEditForm(true)}
              className="btn btn-ghost btn-sm bg-white text-black hover:bg-darkpink hover:text-white">
              <IconPencil size={16} /> Editar
            </button>
            <button
              type="button"
              onClick={() =>
                (document.getElementById(`delete_section_${section.id}`) as HTMLDialogElement)?.showModal()
              }
              className="btn btn-ghost btn-sm bg-white text-black hover:bg-error hover:text-white">
              <IconTrash size={16} /> Eliminar
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert my-5 text-white ${message.includes("Error") ? "alert-error" : "alert-success"}`}>
          {message}
        </div>
      )}

      <div className="overflow-hidden bg-white rounded-lg shadow relative p-6 md:p-10">
        <div className="mb-6 max-w-full overflow-x-auto">
          <div role="tablist" className="tabs tabs-boxed w-fit bg-black">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`tab transition-colors ${
                  activeTab === tab.key
                    ? "!bg-darkpink !text-white"
                    : "text-gray-300 hover:!text-white"
                }`}
                onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "estudiantes" && <CuadrosAsignar selectedSection={section} />}
        {activeTab === "pagos" && <PagosTab selectedSection={section} />}
        {activeTab === "asistencia" && (
          <p className="text-center py-10 text-gray-400">Próximamente</p>
        )}
      </div>

      <DeleteSectionDialog section={section} onConfirm={handleDelete} />
    </>
  );
}

export default SectionDetail;
