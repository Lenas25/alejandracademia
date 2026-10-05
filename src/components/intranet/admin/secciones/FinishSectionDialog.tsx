"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { Section } from "@/types/section";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";

// Confirm dialog for the "Finalizar / Reabrir sección" action — same
// `<dialog>` structure and palette as DeleteSectionDialog, but without the
// typed confirmation word: unlike section deletion, finishing/reopening is
// reversible and non-destructive (nothing is deleted, editing stays open),
// so a single confirm click is enough.
interface FinishSectionDialogProps {
  section: Section;
  mode: "finish" | "reopen";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

function FinishSectionDialog({
  section,
  mode,
  onConfirm,
  loading,
}: FinishSectionDialogProps) {
  const dialogId = `finish_section_${section.id}`;
  const isFinish = mode === "finish";

  const handleClose = () => {
    (document.getElementById(dialogId) as HTMLDialogElement)?.close();
  };

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
    handleClose();
  };

  return (
    <dialog
      id={dialogId}
      className="modal modal-bottom sm:modal-middle backdrop-blur-sm"
      onCancel={(e) => {
        if (loading) e.preventDefault();
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-box text-white max-h-[90dvh] overflow-y-auto overflow-x-clip pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
        <form method="dialog">
          <button
            type="submit"
            onClick={handleClose}
            disabled={loading}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </button>
        </form>
        <div className="flex items-center gap-5">
          <h3 className="font-semibold text-xl sm:text-2xl">
            {isFinish ? "Finalizar Sección" : "Reabrir Sección"}
          </h3>
          <IconAlertTriangle className="text-yellow" />
        </div>
        <p className="py-4 text-base">
          {isFinish ? (
            <>
              Vas a finalizar la sección <strong>{section.name}</strong>. Se
              publicará la nota final (Aprobado/Desaprobado) a los alumnos.
            </>
          ) : (
            <>
              Vas a reabrir la sección <strong>{section.name}</strong>. Los
              alumnos dejarán de ver el resultado final hasta que la vuelvas a
              finalizar.
            </>
          )}
        </p>
        <p className="text-sm text-gray-300">
          {isFinish
            ? "La sección sigue siendo editable y puedes reabrirla cuando quieras. No se elimina nada."
            : "Las matrículas de la sección vuelven a quedar activas. No se elimina nada."}
        </p>
        <div className="w-full flex flex-wrap justify-end gap-3 mt-4">
          <button type="button" onClick={handleClose} disabled={loading} className="btn btn-sm h-10 min-h-10">
            Cancelar
          </button>
          <LoadingButton
            type="button"
            onClick={handleConfirm}
            loading={loading}
            loadingText={isFinish ? "Finalizando…" : "Reabriendo…"}
            className="btn btn-sm h-10 min-h-10 bg-darkpink text-white text-base sm:text-lg hover:bg-black disabled:bg-gray-500 disabled:text-gray-300"
          >
            {isFinish ? "Finalizar sección" : "Reabrir sección"}
          </LoadingButton>
        </div>
      </div>
    </dialog>
  );
}

export default FinishSectionDialog;
