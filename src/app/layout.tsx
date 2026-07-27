import type { Viewport } from "next";
import "./globals.css";
import { Montserrat } from "next/font/google";
import ProviderComp from "@/redux/provider";

const montserrat = Montserrat({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// ROOT CAUSE of the systemic mobile horizontal-overflow bug across the
// intranet: there was no `viewport` meta tag anywhere in the app. Without
// it, mobile browsers fall back to a virtual desktop-width layout viewport
// (~980px) and shrink the whole page to fit the screen. That single missing
// tag explains every symptom reported at ~360-430px: the page appears to
// have real horizontal scroll (it does — it's laid out at ~980px), `fixed
// inset-0` modals center over that ~980px virtual page instead of the
// physical screen (so they read as off-center/cut off), and fixed-size
// elements (like the old bottom nav pill) look oversized once the user
// pinch-zooms to a readable scale. Declaring the viewport here (App Router
// metadata API) locks every route — marketing and intranet alike — to the
// real device width at 1:1 scale, which is the actual fix; the intranet
// shell's `overflow-x-hidden` safety net (see admin/alumno layouts) only
// guards against a *future* stray-wide child now that this is fixed.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" data-theme="dark">
      <body className={montserrat.className}>
        <ProviderComp>{children}</ProviderComp>
      </body>
    </html>
  );
}
