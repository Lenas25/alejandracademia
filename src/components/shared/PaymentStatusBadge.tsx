import { PaymentStatus } from "@/types/payment";
import { IconCheck, IconClock, IconAlertTriangle } from "@tabler/icons-react";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

// Single source of truth for the cuota status badge (admin PagosTab +
// alumno CuotasCard render identically, sdd/pagos due-date slice). Three
// visually distinct states using the app palette instead of daisyUI's
// default `badge-success` / `badge-warning` / `badge-error` (those resolve
// against the theme's violet-tinted defaults, not the brand palette):
// - `cancelado`  -> emerald/green, check icon
// - `pendiente`  -> app yellow (#F6B81D)
// - `atrasado`   -> red — informational overdue flag, NOT a late fee
const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string; Icon: typeof IconCheck }
> = {
  cancelado: {
    label: "Cancelado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-300",
    Icon: IconCheck,
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-yellow/15 text-black border-yellow",
    Icon: IconClock,
  },
  atrasado: {
    label: "Atrasada",
    className: "bg-red-50 text-red-700 border-red-300",
    Icon: IconAlertTriangle,
  },
};

export function PaymentStatusBadge({ status, className = "" }: PaymentStatusBadgeProps) {
  const { label, className: statusClassName, Icon } = STATUS_CONFIG[status];
  return (
    <span
      className={`badge badge-sm gap-1 font-medium border whitespace-nowrap ${statusClassName} ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}
