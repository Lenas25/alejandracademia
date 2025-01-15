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
      <div className="relative p-5 md:p-10 md:min-h-screen">
        <Sidebar pathname={pathname} />
        <div className="pb-36 md:pb-0 md:pl-[150px]">
        {children}
        </div>
      </div>
    </RequireAuth>
  );
}
