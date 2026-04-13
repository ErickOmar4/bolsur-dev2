import { Order, Product } from "@/types/order";
import { AlertTriangle, Clock, Package } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface UrgentAlertsProps {
  orders: Order[];
  products: Product[];
}

export function UrgentAlerts({ orders, products }: UrgentAlertsProps) {
  const today = new Date();
  
  const urgentOrders = orders.filter(order => {
    if (order.status === 'delivered') return false;
    const daysUntil = differenceInDays(order.deliveryDate, today);
    return daysUntil <= 2;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  if (urgentOrders.length === 0 && lowStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm animate-fade-in">
      <div className="p-4 border-b flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-foreground">Alertas</h3>
      </div>
      <div className="p-4 space-y-3">
        {urgentOrders.map((order) => {
          const daysUntil = differenceInDays(order.deliveryDate, today);
          const isOverdue = daysUntil < 0;
          
          return (
            <div 
              key={order.id}
              className={cn(
                "p-3 rounded-lg border flex items-start gap-3",
                isOverdue ? "alert-urgent" : "alert-warning"
              )}
            >
              <Clock className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {isOverdue ? 'Pedido vencido' : 'Entrega próxima'}
                </p>
                <p className="text-xs opacity-80">
                  {order.orderNumber} - {order.clientName}
                </p>
                <p className="text-xs opacity-80">
                  {isOverdue 
                    ? `Venció ${format(order.deliveryDate, "dd MMM", { locale: es })}`
                    : `Entrega: ${format(order.deliveryDate, "dd MMM", { locale: es })}`
                  }
                </p>
              </div>
            </div>
          );
        })}

        {lowStockProducts.map((product) => (
          <div 
            key={product.id}
            className="p-3 rounded-lg border alert-warning flex items-start gap-3"
          >
            <Package className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Stock bajo</p>
              <p className="text-xs opacity-80">{product.name}</p>
              <p className="text-xs opacity-80">
                {product.stock} unidades (mín: {product.minStock})
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
