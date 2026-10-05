import { IconTrashFilled } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";

/**
 * Single controlled delete dialog rendered once per list. `open` drives
 * showModal()/close(); native closes (Esc, form method=dialog) call `onClose`.
 */
function ModalDelete({
  open,
  onClose,
  handleDelete,
  name,
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  handleDelete: () => void | Promise<void>;
  name?: string;
  pending?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal backdrop-blur-sm"
      onClose={onClose}
      onCancel={(e) => {
        if (pending) e.preventDefault();
      }}>
      <div className="modal-box text-white max-h-[90dvh] overflow-y-auto">
        <form method="dialog">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <div className="flex items-center gap-5">
          <h3 className="font-semibold text-2xl">Eliminar</h3>
          <IconTrashFilled />
        </div>
        <p className="py-4 text-base">
          ¿Estás seguro que deseas eliminar a{" "}
          <strong className="break-words">{name}</strong>?
        </p>
        <div className="w-full flex justify-end gap-3">
          <form method="dialog">
            <button type="submit" disabled={pending} className="btn btn-sm">
              Cancelar
            </button>
          </form>
          <LoadingButton
            type="button"
            onClick={handleDelete}
            loading={pending}
            loadingText="Eliminando…"
            className="btn btn-sm btn-error text-white text-lg">
            Eliminar
          </LoadingButton>
        </div>
      </div>
    </dialog>
  );
}

export default ModalDelete;
