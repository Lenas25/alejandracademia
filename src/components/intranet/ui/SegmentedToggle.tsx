"use client";

import { KeyboardEvent, ReactNode, useRef } from "react";

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  count?: number;
}

interface SegmentedToggleProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  // "tabs": the options switch between tab panels (role tablist/tab, pair with
  // `idPrefix` so aria-controls/aria-labelledby can be wired to the panel).
  // "radio": the options pick a view mode with no panel (radiogroup/radio).
  variant?: "tabs" | "radio";
  // Tabs variant only. Tab id = `${idPrefix}-tab-${value}`, controlled panel
  // id = `${idPrefix}-panel-${value}`.
  idPrefix?: string;
}

// Segmented control: light-gray rounded track, equal-width options, the
// active one rendered as a white pill. Roving tabindex with arrow/Home/End
// navigation (selection follows focus).
export function SegmentedToggle({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
  variant = "tabs",
  idPrefix,
}: SegmentedToggleProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isTabs = variant === "tabs";

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % options.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + options.length) % options.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = options.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    // Radio variant: manual activation (Space/Enter click) so arrowing does not trigger view switches or fetches.
    if (isTabs) onChange(options[next].value);
    refs.current[next]?.focus();
  };

  // Fall back to the first option so exactly one stop is always tabbable.
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <div
      role={isTabs ? "tablist" : "radiogroup"}
      aria-label={ariaLabel}
      className={`grid w-full auto-cols-fr grid-flow-col gap-1 rounded-lg bg-gray-100 p-1 sm:w-auto sm:min-w-[16rem] ${className}`}
    >
      {options.map((option, index) => {
        const selected = index === activeIndex;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role={isTabs ? "tab" : "radio"}
            {...(isTabs
              ? {
                  "aria-selected": selected,
                  ...(idPrefix && {
                    id: `${idPrefix}-tab-${option.value}`,
                    "aria-controls": `${idPrefix}-panel-${option.value}`,
                  }),
                }
              : { "aria-checked": selected })}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`min-h-11 min-w-0 whitespace-nowrap rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkpink ${
              selected
                ? "border-gray-200 bg-white text-black shadow-sm"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {option.label}
            {option.count !== undefined && ` (${option.count})`}
          </button>
        );
      })}
    </div>
  );
}
