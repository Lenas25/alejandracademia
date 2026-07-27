"use client";

import type { Course } from "@/types/course";
import { IconPhotoX, IconSend, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Keep in sync with `images.remotePatterns` in next.config.ts. next/image
// throws (crashing the whole grid, not just the card) when it renders a
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

// Small, non-exhaustive markdown stripper for the card teaser — only needs
// to keep the 3-line preview readable, not to fully round-trip markdown.
function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .trim();
}

function buildWhatsappUrl(courseName: string): string {
  // Same wa.me destination/message pattern reused from the old CourseInfo
  // flip-card CTA.
  return `https://wa.me/584247247939?text=¡Hola!%20Estoy%20interesado/a%20en%20obtener%20más%20información%20sobre%20${encodeURIComponent(courseName)}%20Gracias%21`;
}

function CourseImage({
  imageUrl,
  name,
  className,
  iconSize = 32,
}: {
  imageUrl: string;
  name: string;
  className?: string;
  iconSize?: number;
}) {
  if (!imageUrl || !isAllowedImageHost(imageUrl)) {
    return (
      <div className={`absolute inset-0 flex h-full w-full items-center justify-center bg-grey ${className ?? ""}`}>
        <IconPhotoX size={iconSize} className="text-black/50" />
      </div>
    );
  }
  return (
    <Image
      src={imageUrl}
      alt={name}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${className ?? ""}`}
    />
  );
}

interface CourseCardProps {
  course: Course;
}

function CourseCard({ course }: CourseCardProps) {
  const [open, setOpen] = useState(false);
  const plainTeaser = stripMarkdown(course.description);
  const whatsappUrl = buildWhatsappUrl(course.name);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-shadow duration-300 hover:shadow-xl">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <CourseImage imageUrl={course.imageUrl} name={course.name} />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <h3 className="text-xl font-semibold text-black lg:text-2xl">{course.name}</h3>
          <p className="line-clamp-3 flex-1 text-sm text-black/70 md:text-base">{plainTeaser}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-label={`Ver más sobre ${course.name}`}
              className="btn btn-sm bg-black text-white hover:bg-flamingo border-none">
              Ver más
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Inscribirme en ${course.name}`}
              className="btn btn-sm bg-darkpink text-white hover:bg-flamingo border-none">
              <IconSend size={18} aria-hidden="true" />
              Inscribirme
            </a>
          </div>
        </div>
      </article>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={course.name}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-semibold text-black lg:text-2xl">{course.name}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="btn btn-ghost btn-sm btn-circle shrink-0 text-black">
                <IconX size={20} />
              </button>
            </div>

            <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg">
              <CourseImage imageUrl={course.imageUrl} name={course.name} iconSize={48} />
            </div>

            <div className="md-content mt-4 text-black">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{course.description}</ReactMarkdown>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Inscribirme en ${course.name}`}
              className="btn mt-6 w-full bg-darkpink text-white hover:bg-flamingo border-none">
              <IconSend size={18} aria-hidden="true" />
              Inscribirme
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default CourseCard;
