import { IconTrashFilled } from "@tabler/icons-react";
import React from "react";

function ModalDelete({
  handleDelete,
  info
}: {
  handleDelete: () => void;
  info: number | undefined;
}) {
  return (
    <dialog id={`delete_${info}`} className="modal">
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
        <p className="py-4 text-base">Estas seguro que deseas eliminar el #{info}</p>
        <div className="w-full flex justify-end gap-5">
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-sm btn-primary bg-yellow border-none text-lg">
            Aceptar
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ModalDelete;
