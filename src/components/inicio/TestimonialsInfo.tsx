"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";

function TestimonialsInfo({
  testimonial,
}: Readonly<{ testimonial: { id: number; text: string; name: string } }>) {
  return (
    <motion.div
    initial={{ width: 0 }}
    whileInView={{ width: "100%" }}className="relative h-[250px] bg-white rounded-lg mx-2 p-5 flex flex-col justify-between xl:h-[350px]">
      <div className="italic overflow-hidden text-ellipsis line-clamp-5 z-10">
        &quot;
        <span className="lg:text-xl 2xl:text-2xl">{testimonial.text}</span>
        &quot;
      </div>
      <div className="flex gap-4 items-center">
        <span className="font-semisemibold text-xl 2xl:text-3xl">{testimonial.name}</span>
      </div>
      <div className="absolute top-2 right-2 z-0">
        <Image src="/quote.svg" alt="quote" width={100} height={100} />
      </div>
    </motion.div>
  );
}

export default TestimonialsInfo;
