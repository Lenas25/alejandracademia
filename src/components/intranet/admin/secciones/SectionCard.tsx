"use client";

import { IconPencil, IconPhotoX, IconTrash, IconUser } from "@tabler/icons-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/stores";
import { Section } from "@/types/section";
import { Roles } from "@/types/roles";
import DeleteSectionDialog from "./DeleteSectionDialog";

interface SectionCardProps {
  section: Section;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void | Promise<void>;
}

// Keep in sync with `images.remotePatterns` in next.config.ts. next/image
// throws (crashing the whole list, not just the card) when it renders a
// `src` whose host isn't allowlisted there, so any host outside this set
// must fall back to the placeholder icon instead of reaching <Image>.
const ALLOWED_IMAGE_HOSTS = new Set(["res.cloudinary.com"]);

function isAllowedImageHost(url: string): boolean {
  try {
    return ALLOWED_IMAGE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function SectionCard({ section, onEdit, onDelete }: SectionCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAppSelector((state) => state.user?.userLogin?.role);
  const isAdmin = role === Roles.ADMIN;

  const tutorLabel = section.tutor
    ? `${section.tutor.name} ${section.tutor.lastName ?? ""}`.trim()
    : "Sin tutor asignado";

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
    return onDelete(section);
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
          {section.course?.imageUrl && isAllowedImageHost(section.course.imageUrl) ? (
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
          <p className="text-xs text-gray-400 line-clamp-2 break-words" title={section.course?.name}>
            {section.course?.name}
          </p>
          <p className="font-semibold text-lg line-clamp-2 break-words" title={section.name}>
            {section.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <IconUser size={16} className="shrink-0" />
        <span className="line-clamp-2 break-words min-w-0" title={tutorLabel}>
          {tutorLabel}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`badge badge-ghost badge-sm text-white p-3 border-none font-semibold text-xs ${
            section.isActive ? "badge-success" : "badge-error"
          }`}>
          {section.isActive ? "Activa" : "Inactiva"}
        </span>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEdit}
              aria-label={`Editar sección ${section.name}`}
              className="btn btn-ghost btn-sm min-h-10 min-w-10 bg-black text-white hover:bg-darkpink hover:text-white">
              <IconPencil size={16} />
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              aria-label={`Eliminar sección ${section.name}`}
              className="btn btn-ghost btn-sm min-h-10 min-w-10 bg-black text-white hover:bg-darkpink hover:text-white">
              <IconTrash size={16} />
            </button>
          </div>
        )}
      </div>
      {isAdmin && <DeleteSectionDialog section={section} onConfirm={handleConfirmDelete} />}
    </div>
  );
}

export default SectionCard;
