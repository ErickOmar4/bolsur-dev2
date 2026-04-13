import { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";
import { Clock, Loader2, CheckCircle2, Truck } from "lucide-react";

interface StatusBadgeProps {
  status: OrderStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<OrderStatus, { 
  label: string; 
  className: string;
  icon: typeof Clock;
}> = {
  'pending': { 
    label: 'Pendiente', 
    className: 'status-pending',
    icon: Clock
  },
  'in-progress': { 
    label: 'En Proceso', 
    className: 'status-in-progress',
    icon: Loader2
  },
  'finished': { 
    label: 'Terminado', 
    className: 'status-finished',
    icon: CheckCircle2
  },
  'delivered': { 
    label: 'Entregado', 
    className: 'status-delivered',
    icon: Truck
  },
};

export function StatusBadge({ status, showIcon = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "status-badge",
      config.className,
      size === 'sm' && "text-[10px] px-2 py-0.5"
    )}>
      {showIcon && (
        <Icon className={cn(
          "shrink-0",
          size === 'sm' ? "h-3 w-3" : "h-3.5 w-3.5",
          status === 'in-progress' && "animate-spin"
        )} />
      )}
      {config.label}
    </span>
  );
}
