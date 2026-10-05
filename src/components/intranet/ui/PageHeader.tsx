import type { ReactNode } from "react";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  count: number;
  countLabel: { singular: string; plural: string };
  subtitle?: string;
  /** Action buttons (rendered as a group). Omit for roles without actions. */
  children?: ReactNode;
}

/** Shared compact banner for the admin list pages. */
export function PageHeader({
  icon,
  title,
  count,
  countLabel,
  subtitle,
  children,
}: PageHeaderProps) {
  const label = count === 1 ? countLabel.singular : countLabel.plural;
  return (
    <header className="mb-5 flex flex-col gap-4 rounded-2xl bg-black p-4 text-white shadow sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-xl font-medium sm:text-2xl">{title}</h1>
            <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-sm font-semibold text-black">
              <span aria-hidden="true">
                {count}
                <span className="hidden sm:inline"> {label}</span>
              </span>
              <span className="sr-only">{`${count} ${label}`}</span>
            </span>
          </div>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-white/60">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div
          role="group"
          aria-label="Acciones"
          className="grid shrink-0 grid-cols-2 gap-3 sm:flex sm:items-center">
          {children}
        </div>
      )}
    </header>
  );
}

const actionBase =
  "inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 text-base font-medium whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed";

export function HeaderPrimaryAction({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${actionBase} bg-darkpink text-white hover:bg-flamingo hover:text-black`}>
      {icon}
      {children}
    </button>
  );
}

export function HeaderSecondaryAction({
  onClick,
  icon,
  disabled,
  disabledTitle,
  children,
}: {
  onClick: () => void;
  icon: ReactNode;
  disabled?: boolean;
  disabledTitle?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledTitle : undefined}
      className={`${actionBase} border border-white/70 text-white hover:bg-white hover:text-black disabled:border-white/20 disabled:text-white/40 disabled:hover:bg-transparent disabled:hover:text-white/40`}>
      {icon}
      {children}
    </button>
  );
}
