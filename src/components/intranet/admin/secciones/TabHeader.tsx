import { ReactNode } from "react";

interface TabHeaderProps {
  title: string;
  children?: ReactNode;
}

// Shared header for the section-detail tabs (Estudiantes/Notas/Pagos/
// Asistencia). Enforces one visual language across all four: a title plus
// an optional right-aligned actions/toggle slot, divided by a single thin
// rule. See sdd/section-tabs/design-standard for the full convention.
function TabHeader({ title, children }: TabHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-black min-w-0 break-words">{title}</h2>
      {children && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto max-w-full">{children}</div>}
    </div>
  );
}

export default TabHeader;
