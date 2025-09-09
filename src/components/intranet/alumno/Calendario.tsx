"use client";

import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const getWeekDays = (date: Date) => {
  const startOfWeek = new Date(date);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(date.getDate() + diff);

  const days = [];
  for (let i = 0; i < 6; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push({
      day: day.toLocaleDateString("es-ES", { weekday: "short" }).replace('.', ''),
      date: day.getDate().toString(),
      fullDate: day,
    });
  }
  return days;
};

const formatMonthYear = (date: Date) => {
  const month = date.toLocaleDateString("es-ES", { month: "short" });
  const year = date.toLocaleDateString("es-ES", { year: "numeric" });

  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capitalizedMonth}, ${year}`;
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

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <p className="font-semibold text-gray-800">{formatMonthYear(currentDate)}</p>
          <button 
            onClick={handleGoToToday} 
            className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
          >
            Hoy
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrevWeek} className="p-1 text-gray-500 hover:text-black transition-colors"><IconChevronLeft size={20} /></button>
          <button onClick={handleNextWeek} className="p-1 text-gray-500 hover:text-black transition-colors"><IconChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2 text-center">
        {weekDays.map(({ day, date, fullDate }) => {
          const isToday = 
            fullDate.getDate() === today.getDate() &&
            fullDate.getMonth() === today.getMonth() &&
            fullDate.getFullYear() === today.getFullYear();

          return (
            <div key={date} className={`p-2 rounded-lg transition-colors ${isToday ? 'bg-black text-white' : 'bg-gray-50'}`}>
              <span className={`text-xs uppercase font-bold ${isToday ? 'text-gray-300' : 'text-gray-400'}`}>{day}</span>
              <p className="font-semibold text-lg">{date}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}