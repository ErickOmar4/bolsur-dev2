import { useState } from "react";
import { Order } from "@/types/order";
import { StatusBadge } from "./StatusBadge";
import { PaymentModal } from "./PaymentModal";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Mail, MoreHorizontal, AlertTriangle, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, differenceInDays, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const navigate = useNavigate();
  const today = new Date();
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

  const getDeliveryUrgency = (deliveryDate: Date, status: Order['status']) => {
    if (status === 'delivered') return null;
    const daysUntil = differenceInDays(deliveryDate, today);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 2) return 'urgent';
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pedido
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cliente
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Entrega
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order, index) => {
              const urgency = getDeliveryUrgency(order.deliveryDate, order.status);
              
              return (
                <tr 
                  key={order.id} 
                  className={cn(
                    "hover:bg-muted/30 transition-colors cursor-pointer animate-fade-in",
                    urgency === 'overdue' && "bg-destructive/5",
                    urgency === 'urgent' && "bg-[hsl(var(--status-pending)/0.05)]"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {urgency && (
                        <AlertTriangle className={cn(
                          "h-4 w-4 shrink-0",
                          urgency === 'overdue' ? "text-destructive" : "text-status-pending"
                        )} />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(order.createdAt, "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-foreground">{order.clientName}</p>
                    <p className="text-xs text-muted-foreground">{order.clientPhone}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className={cn(
                      "font-medium",
                      urgency === 'overdue' && "text-destructive",
                      urgency === 'urgent' && "text-status-pending"
                    )}>
                      {format(order.deliveryDate, "dd MMM yyyy", { locale: es })}
                    </p>
                    {urgency === 'overdue' && (
                      <p className="text-xs text-destructive font-medium">Vencido</p>
                    )}
                    {urgency === 'urgent' && (
                      <p className="text-xs text-status-pending font-medium">Urgente</p>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{order.items.length} producto(s)</p>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/orders/${order.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPaymentOrder(order)}>
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar por correo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {paymentOrder && (
        <PaymentModal
          open={!!paymentOrder}
          onOpenChange={(open) => !open && setPaymentOrder(null)}
          order={paymentOrder}
        />
      )}
    </div>
  );
}
