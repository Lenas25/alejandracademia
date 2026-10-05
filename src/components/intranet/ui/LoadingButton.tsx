"use client";

import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from "react";

export interface LoadingButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

/**
 * Button with a pending state. While `loading` it is disabled, announces
 * aria-busy, swallows clicks and shows a spinner. Both the idle and the
 * loading labels are rendered in the same grid cell so the width is the
 * widest of the two and the button never jumps.
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    { loading = false, loadingText, children, disabled, onClick, type = "button", ...rest },
    ref,
  ) {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <button
        {...rest}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        onClick={handleClick}>
        <span className="inline-grid items-center justify-items-center">
          <span
            className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${
              loading ? "invisible" : ""
            }`}
            aria-hidden={loading || undefined}>
            {children}
          </span>
          {loading && (
            <span className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-sm" aria-hidden="true" />
              {loadingText ?? children}
            </span>
          )}
        </span>
      </button>
    );
  },
);

/** True once `active` has been continuously true for `ms` milliseconds. */
export function useSlowFlag(active: boolean, ms = 5000): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const id = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(id);
  }, [active, ms]);
  return slow;
}
