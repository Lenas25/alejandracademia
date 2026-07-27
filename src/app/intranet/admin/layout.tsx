"use client";

import { Sidebar } from "@/components";
import RequireAuth from "@/components/intranet/RequireAuth";
import { usePathname } from "next/navigation";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <RequireAuth>
      <div className="relative p-5 md:p-7 md:min-h-screen overflow-x-hidden">
        <Sidebar pathname={pathname} />
        {/* `pt-16` clears the fixed mobile hamburger button (Sidebar);
            `overflow-x-hidden`/`min-w-0`/`max-w-full` are a safety net so a
            stray wide child can never force page-level horizontal scroll
            again — the actual overflow root cause was the missing viewport
            meta tag, fixed in the root layout. */}
        <div className="pt-16 md:pt-0 md:pl-[150px] min-w-0 max-w-full overflow-x-hidden">
        {children}
        </div>
      </div>
    </RequireAuth>
  );
}
