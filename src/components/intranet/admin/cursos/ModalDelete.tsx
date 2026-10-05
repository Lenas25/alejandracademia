import { IconTrashFilled } from "@tabler/icons-react";
import React from "react";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";

function ModalDelete({
  handleDelete,
  info,
  name,
  pending = false,
}: {
  handleDelete: () => void | Promise<void>;
  info: number | undefined;
  name?: string;
  pending?: boolean;
}) {
  return (
    <dialog
      id={`delete_${info}`}
      className="modal backdrop-blur-sm"
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
          ¿Estás seguro que deseas eliminar{" "}
          <strong>{name ?? `#${info}`}</strong>?
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
