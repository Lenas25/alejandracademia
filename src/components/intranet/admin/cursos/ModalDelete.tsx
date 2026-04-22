import { IconTrashFilled } from "@tabler/icons-react";
import React from "react";

function ModalDelete({
  handleDelete,
  info,
  name,
}: {
  handleDelete: () => void;
  info: number | undefined;
  name?: string;
}) {
  return (
    <dialog id={`delete_${info}`} className="modal backdrop-blur-sm">
      <div className="modal-box text-white">
        <form method="dialog">
          <button
            type="submit"
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
            <button type="submit" className="btn btn-sm">
              Cancelar
            </button>
          </form>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-sm btn-error text-white text-lg">
            Eliminar
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ModalDelete;
