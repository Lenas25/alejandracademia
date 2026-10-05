"use client";

import { Sidebar } from "@/components";
import RequireAuth from "@/components/intranet/RequireAuth";
import { ToastProvider } from "@/components/intranet/ui/Toast";
import { usePathname } from "next/navigation";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <RequireAuth>
      <ToastProvider>
      <div className="relative p-5 md:p-10 lg:min-h-screen overflow-x-clip">
        <Sidebar pathname={pathname} />
        {/* `pt-16` clears the fixed mobile hamburger button (Sidebar);
            `overflow-x-clip`/`min-w-0`/`max-w-full` are a safety net so a
            stray wide child can never force page-level horizontal scroll
            again — the actual overflow root cause was the missing viewport
            meta tag, fixed in the root layout. */}
        <div className="pt-16 md:pt-0 md:pl-[72px] md:h-full min-w-0 max-w-full overflow-x-clip">
        {children}
        </div>
      </div>
      </ToastProvider>
    </RequireAuth>
  );
}
