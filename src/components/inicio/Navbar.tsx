import { IconPhone } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "./Menu";

export function Navbar() {
  return (
    <nav className="flex items-center gap-3 justify-between py-6 border-b-grey border-b-2 mx-0 px-3 md:mx-3 md:px-5 xl:px-10">
      <Menu />
      <div className="w-[140px] md:w-[200px] lg:w-[250px] xl:w-[300px]">
        <Image src="/nombreLogo.png" alt="Logo" width={300} height={300} priority />
      </div>
      <div className="flex flex-wrap items-center gap-2 justify-center md:gap-4 xl:gap-10">
        <a href="tel:+584247247939" className="font-semibold gap-2 flex justify-center items-center">
          <IconPhone className="w-full h-full p-2 rounded-full transition bg-flamingo color-white ease-in-out delay-150 hover:color-black hover:bg-transparent border-2 hover:border-black"/>
          <span className="hidden md:block lg:text-lg">+584247247939</span>
        </a>
        <Link href="/intranet" className="px-2 py-2 border-black border-2 text-center md:px-8 hover:bg-flamingo lg:text-xl">Inicia Sesion</Link>
      </div>
    </nav>
  );
}
