"use client";

import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const getWeekDays = (date: Date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1);
  const days = [];
  for (let i = 0; i < 6; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push({
      day: day.toLocaleDateString("es-ES", { weekday: "short" }),
      date: day.toLocaleDateString("es-ES", { day: "numeric" }),
    });
  }
  return days;
};

const formatMonthYear = (date: Date) => {
  const formattedDate = date.toLocaleDateString("es-ES", {
    month: "short",
    year: "numeric",
  });
  const [month, year] = formattedDate.split(" ");
  return `${month.charAt(0).toUpperCase() + month.slice(1)}, ${year}`;
};

export function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const handlePrevWeek = () => {
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(currentDate.getDate() - 7);
    setCurrentDate(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(currentDate.getDate() + 7);
    setCurrentDate(nextWeek);
  };
  const weekDays = getWeekDays(currentDate);
  const monthYear = formatMonthYear(currentDate);

  return (
    <div className="lg:order-2 lg:h-full">
      <div className="flex justify-between items-center gap-5 mb-4">
        <p className="text-2xl font-semisemibold">{monthYear}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-2 bg-white rounded-full">
            <IconChevronLeft />
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2 bg-white rounded-full">
            <IconChevronRight />
          </button>
        </div>
      </div>
        <div className="lg:overflow-y-auto lg:h-[21rem]">
          <div className="w-full grid grid-cols-6 grid-rows-1 gap-2 mt-5 lg:grid-rows-6 lg:grid-cols-1 lg:gap-3">
            {weekDays.map((day) => {
              const today = new Date().toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
              });
              const isToday = `${day.day} ${day.date}` === today;
              return (
                <div
                  key={day.date}
                  className={`flex flex-col flex-wrap justify-center items-center rounded-md shadow-lg p-3 w-full ${
                    isToday ? "bg-black text-white" : "bg-white text-black"
                  }`}>
                  <span>{day.day}</span>
                  <span>{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
