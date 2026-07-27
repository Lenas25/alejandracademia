import Link from "next/link";
import type { ReactNode } from "react";

interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
  /** "icon" (default) = the desktop circular icon-only pill button, used by
   * the fixed left sidebar — unchanged. "row" = a full-width icon+label row,
   * used by the mobile hamburger drawer (see Sidebar.tsx). */
  variant?: "icon" | "row";
  /** Called after a real navigation click (not on the current/active link)
   * so the mobile drawer can close itself on link tap. */
  onNavigate?: () => void;
}

const SidebarLink = ({
  href,
  icon,
  label,
  isActive,
  variant = "icon",
  onNavigate,
}: SidebarLinkProps) => {
  if (variant === "row") {
    return (
      <Link
        href={href}
        aria-label={label}
        onClick={onNavigate}
        className={`flex items-center gap-3 w-full rounded-lg px-4 py-3 text-base font-medium transition-colors ${
          isActive ? "bg-darkpink text-white" : "text-white/80 hover:bg-rose hover:text-white"
        }`}>
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative group flex items-center justify-center shrink-0 min-w-11 min-h-11 text-lg font-semibold cursor-pointer rounded-full transition-all delay-150 ease-in-out p-2 md:p-4 md:min-w-0 md:min-h-0 ${isActive ? 'bg-rose text-white' : 'hover:bg-rose'}`}>
      {icon}
      {/* Desktop-only hover tooltip. Hidden on mobile: the fixed bottom bar
          has no hover state on touch, and the old always-in-DOM tooltip
          (positioned with -top-1/2, sized off the icon's own box) could
          flash in an odd spot on tap. `aria-label` above keeps the icon
          accessible without it. */}
      <span className="hidden md:block absolute md:left-full md:top-1/2 ml-2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-sm rounded px-2 py-1 transition-opacity duration-300 z-20">
        {label}
      </span>
    </Link>
  );
};

export default SidebarLink;