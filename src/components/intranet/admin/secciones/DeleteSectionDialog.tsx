"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { useState } from "react";
import { Section } from "@/types/section";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";

// Escalated delete confirmation — adapted from the "Terminar Curso" dialog
// pattern (see git history of cursos/RowCursos.tsx pre-PR3 trim): same
// `<dialog>` structure, IconAlertTriangle header, explicit cascade copy.
// Section deletion cascades further than "Terminar Curso" ever did (spec:
// "Section Deletion" — matrículas, notas y actividades se eliminan
// permanentemente), so this dialog additionally requires typing a
// confirmation word before the destructive action is enabled.
interface DeleteSectionDialogProps {
  section: Section;
  onConfirm: () => void | Promise<void>;
}

const CONFIRM_WORD = "ELIMINAR";

function DeleteSectionDialog({ section, onConfirm }: DeleteSectionDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const dialogId = `delete_section_${section.id}`;

  const handleClose = () => {
    setConfirmText("");
    (document.getElementById(dialogId) as HTMLDialogElement)?.close();
  };

  const handleConfirm = async () => {
    if (pending || confirmText.trim().toUpperCase() !== CONFIRM_WORD) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
    handleClose();
  };

  return (
    <dialog
      id={dialogId}
      className="modal backdrop-blur-sm"
      onClick={(event) => event.stopPropagation()}>
      <div className="modal-box text-white max-h-[90dvh] overflow-y-auto">
        <form method="dialog">
          <button
            type="submit"
            onClick={handleClose}
            disabled={pending}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <div className="flex items-center gap-5">
          <h3 className="font-semibold text-2xl">Eliminar Sección</h3>
          <IconAlertTriangle className="text-yellow" />
        </div>
        <p className="py-4 text-base">
          Vas a eliminar permanentemente la sección{" "}
          <strong>{section.name}</strong>, junto con:
        </p>
        <ul className="list-disc list-inside text-base text-gray-300 mb-2">
          <li>Todas las matrículas de estudiantes de esta sección</li>
          <li>Las notas registradas en sus actividades</li>
          <li>Las actividades de la sección</li>
        </ul>
        <p className="text-sm text-lightpink font-semibold">
          Esta acción no se puede deshacer.
        </p>
        <label className="form-control w-full mt-4">
          <div className="label">
            <span className="label-text text-white text-sm">
              Escribe <strong>{CONFIRM_WORD}</strong> para confirmar
            </span>
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={pending}
            className="input input-bordered w-full bg-white text-black"
            autoComplete="off"
          />
        </label>
        <div className="w-full flex justify-end gap-3 mt-4">
          <button type="button" onClick={handleClose} disabled={pending} className="btn btn-sm">
            Cancelar
          </button>
          <LoadingButton
            type="button"
            onClick={handleConfirm}
            loading={pending}
            loadingText="Eliminando…"
            disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORD}
            className="btn btn-sm btn-error text-white text-lg disabled:bg-gray-500 disabled:text-gray-300">
            Eliminar
          </LoadingButton>
        </div>
      </div>
    </dialog>
  );
}

export default DeleteSectionDialog;
