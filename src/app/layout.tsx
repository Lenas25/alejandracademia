

import { globalStore } from "@/redux/stores";
import "./globals.css";
import { Lato } from "next/font/google";
import { Provider } from "react-redux";
import ProviderComp from "@/redux/provider";

const lato = Lato({
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={lato.className}>
        <ProviderComp>{children}</ProviderComp>
      </body>
    </html>
  );
}
