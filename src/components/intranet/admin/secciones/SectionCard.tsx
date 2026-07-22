"use client";

import { IconPencil, IconPhotoX, IconTrash, IconUser } from "@tabler/icons-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Section } from "@/types/section";
import DeleteSectionDialog from "./DeleteSectionDialog";

interface SectionCardProps {
  section: Section;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void;
}

function SectionCard({ section, onEdit, onDelete }: SectionCardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleCardClick = () => {
    router.push(`${pathname}/${section.id}`);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit(section);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    (document.getElementById(`delete_section_${section.id}`) as HTMLDialogElement)?.showModal();
  };

  const handleConfirmDelete = () => {
    onDelete(section);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter") handleCardClick();
      }}
      className="flex flex-col gap-3 bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className="size-16 flex justify-center items-center flex-shrink-0">
          {section.course?.imageUrl ? (
            <Image
              src={section.course.imageUrl}
              alt={section.course.name}
              width={64}
              height={64}
              className="rounded-full object-cover size-full"
            />
          ) : (
            <IconPhotoX size={32} className="text-black" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 truncate">{section.course?.name}</p>
          <p className="font-semibold text-lg truncate">{section.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <IconUser size={16} />
        <span className="truncate">
          {section.tutor ? `${section.tutor.name} ${section.tutor.lastName ?? ""}` : "Sin tutor asignado"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`badge badge-ghost badge-sm text-white p-3 border-none font-semibold text-xs ${
            section.isActive ? "bg-green-600" : "bg-red-600"
          }`}>
          {section.isActive ? "Activa" : "Inactiva"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleEdit}
            className="btn btn-ghost btn-xs bg-black text-white hover:text-black">
            <IconPencil size={16} />
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="btn btn-ghost btn-xs bg-black text-white hover:text-black">
            <IconTrash size={16} />
          </button>
        </div>
      </div>
      <DeleteSectionDialog section={section} onConfirm={handleConfirmDelete} />
    </div>
  );
}

export default SectionCard;
