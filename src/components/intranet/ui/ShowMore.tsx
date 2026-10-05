"use client";

interface ShowMoreProps {
  shown: number;
  total: number;
  remaining: number;
  onClick: () => void;
  className?: string;
}

/** "Mostrando X de Y" counter plus a "Mostrar más" button when items remain. */
export function ShowMore({ shown, total, remaining, onClick, className = "" }: ShowMoreProps) {
  if (total === 0) return null;
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <p className="text-sm text-gray-500" aria-live="polite">
        Mostrando {shown} de {total}
      </p>
      {remaining > 0 && (
        <button
          type="button"
          onClick={onClick}
          className="btn h-11 min-h-11 w-full sm:w-auto sm:px-10 bg-white text-black border border-grey hover:bg-lightpink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink">
          Mostrar más ({remaining} restantes)
        </button>
      )}
    </div>
  );
}
