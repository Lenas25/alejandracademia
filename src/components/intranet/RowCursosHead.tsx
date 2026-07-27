"use client";

import { useAppSelector } from "@/redux/stores";
import { Section } from "@/types/section";
import { Roles } from "@/types/roles";
import { IconPhotoX, IconSearch } from "@tabler/icons-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

// Shared section-picker header used by Asignar and Notas — operates on
// Section (renamed from the old Course-with-sections shape), not the
// catalog Course.
interface RowCursosProps {
  selectedSection: Section | null;
  sections: Section[];
  handleSelectSection: (section: Section) => void;
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

function RowCursosHead({
  selectedSection,
  sections,
  handleSelectSection,
}: RowCursosProps) {
  const userLogin = useAppSelector((state) => state.user.userLogin);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  sections = userLogin?.role === Roles.TUTOR ? userLogin.sections ?? [] : sections;

  const filteredSections = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return sections
      .filter((section) => section.isActive)
      .filter(
        (section) =>
          section.course?.name?.toLowerCase().includes(term) ||
          section.name?.toLowerCase().includes(term)
      );
  }, [sections, debouncedSearch]);

  return (
    <div className="flex flex-col gap-5 mb-5 bg-black rounded-lg shadow relative p-6">
      <div className="flex items-center gap-5 justify-between w-full flex-wrap">
        <h1 className="text-2xl font-semibold text-white">Cursos</h1>
        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar curso o sección..."
            className="input-search"
          />
          <IconSearch className="absolute right-3 top-2 text-gray-400" />
        </div>
      </div>

      <div className="grid-scroll max-h-[420px] overflow-y-auto pr-1">
        {filteredSections.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <span className="text-gray-400 text-sm text-center">
              No se encontraron secciones
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredSections.map((section) => {
              const isSelected = selectedSection?.id === section.id;
              const imageUrl = section.course?.imageUrl;
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`btn btn-ghost text-base p-3 rounded-lg h-auto flex flex-col items-stretch gap-2 border-2 hover:border-white hover:text-white ${
                    isSelected ? "bg-white text-black" : "bg-black text-white"
                  }`}
                  onClick={() => handleSelectSection(section)}>
                  <div className="w-full aspect-square relative rounded-md overflow-hidden bg-white/10 flex items-center justify-center">
                    {imageUrl && isAllowedImageHost(imageUrl) ? (
                      <Image
                        src={imageUrl}
                        alt={section.course?.name ?? section.name}
                        width={200}
                        height={200}
                        className="object-cover size-full"
                      />
                    ) : (
                      <IconPhotoX
                        size={32}
                        className={isSelected ? "text-black" : "text-white"}
                      />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold truncate">{section.course?.name}</p>
                    <p
                      className={`text-sm truncate ${
                        isSelected ? "text-gray-600" : "text-gray-300"
                      }`}>
                      {section.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RowCursosHead;
