import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
}

const SidebarLink = ({ href, icon, label, isActive }: SidebarLinkProps) => {
  return (
    <Link href={href} className={`relative group text-lg p-2 font-semibold cursor-pointer rounded-full transition-all delay-150 ease-in-out md:p-4 ${isActive ? 'bg-rose text-white' : 'hover:bg-rose'}`}>
      {icon}
      <span className="absolute -top-1/2 left-0 md:left-full ml-2 md:top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-sm rounded px-2 py-1 transition-opacity duration-300 z-20">
        {label}
      </span>
      {isActive && <Image src="/sidebarLink.svg" alt="triangle" width={50} height={50} className="absolute -rotate-90 left-0 -top-16 md:rotate-0 md:top-2 md:left-24" />}
    </Link>
  );
};

export default SidebarLink;