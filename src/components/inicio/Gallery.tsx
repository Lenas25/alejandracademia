import { IconCircleDashedPlus } from "@tabler/icons-react";
import Image from "next/image";

export function Gallery() {
  return (
    <section
      id="galeria"
      className="relative py-10 flex gap-5 items-center flex-col md:px-14 md:py-12 md:gap-10 md:justify-between">
      <div className="absolute z-0 left-0">
        <Image
          src="/bubbleGallery.svg"
          alt="bubbleGallery"
          width={900}
          height={900}
        />
      </div>
      <div className="z-10 flex gap-2 justify-center flex-col text-center">
        <div className="flex justify-center">
          <h2 className="text-center text-6xl font-semibold w-auto lg:text-8xl">
            Galería
          </h2>
        </div>
        <div className="flex justify-center">
          <div className="h-[2px] bg-black w-[80%] lg:h-[4px]" />
        </div>
      </div>
      <div className="m-5 relative gap-2 z-10 grid grid-rows-[300px_300px_300px] md:grid-rows-[300px_300px_300px] grid-cols-2 md:grid-cols-3">
        <div className="col-span-2 row-span-2">
          <Image
            className="w-full h-full object-cover"
            src="/spa1.jpg"
            alt="spa1"
            width={700}
            height={700}
          />
        </div>
        <div className="row-span-1 col-span-1">
          <Image
            className="w-full h-full object-cover"
            src="/spa7.webp"
            alt="spa7"
            width={700}
            height={700}
          />
        </div>
        <div className="hidden md:block">
          <Image
            className="w-full h-full object-cover"
            src="/spa3.jpg"
            alt="spa3"
            width={700}
            height={700}
          />
        </div>
        <div>
          <Image
            className="w-full h-full object-cover"
            src="/spa5.jpg"
            alt="spa5"
            width={700}
            height={700}
          />
        </div>
        <div className="hidden md:block">
          <Image
            className="w-full h-full object-cover"
            src="/spa8.jpg"
            alt="spa8"
            width={700}
            height={700}
          />
        </div>

        <a
          href="https://www.instagram.com/alejandraacademia?igsh=MXAzd2EycGt5a216Yg=="
          target="_blank"
          rel="noreferrer"
          className="relative hidden md:flex justify-center items-center">
          <div className="absolute bg-darkpink backdrop-blur-sm bg-opacity-50 inset-0 z-10" />
          <Image
            className="w-full h-full object-cover z-0"
            src="/spa2.webp"
            alt="spa2"
            width={700}
            height={700}
            priority
          />
          <IconCircleDashedPlus className="absolute z-20 text-white size-[6rem]" />
        </a>
      </div>
    </section>
  );
}
