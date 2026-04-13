import { Order } from "@/types/order";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface RecentOrdersProps {
  orders: any[]; // Cambiado a any[] temporalmente para aceptar los datos del backend
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  // Función de seguridad para evitar el RangeError: Invalid time value
  const safeFormat = (dateValue: any) => {
    try {
      if (!dateValue) return "Pendiente";
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return "Fecha inválida";
      return format(d, "dd MMM", { locale: es });
    } catch (error) {
      return "Error fecha";
    }
  };

  // Validamos que orders sea un array para evitar errores de .slice
  const safeOrders = Array.isArray(orders) ? orders : [];

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Pedidos Recientes</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/sales?tab=orders')}>
          Ver todos
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="divide-y">
        {safeOrders.slice(0, 5).map((order, index) => (
          <div 
            key={order.id || index}
            className="p-4 hover:bg-muted/30 transition-colors cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {/* Usamos || para manejar nombres de propiedades del backend o del mock */}
                  <p className="font-medium text-foreground">{order.orderNumber || `PED-${order.id}`}</p>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground">{order.clientName || order.customer || 'Cliente sin nombre'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {formatCurrency(order.totalAmount || order.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Entrega: {safeFormat(order.deliveryDate || order.date)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {safeOrders.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No hay pedidos recientes registrados.
          </div>
        )}
      </div>
    </div>
  );
}