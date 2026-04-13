import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Printer, X } from "lucide-react";
import { Order } from "@/types/order";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

// Mapeo dinámico para etiquetas de servicio
const serviceLabels: Record<string, string> = {
  serigrafia: "Serigrafía",
  sublimacion: "Sublimación",
  dtf: "DTF",
  bordado: "Bordado",
  "vinil textil": "Vinil Textil",
};

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

const OrderDetailModal = ({ order, open, onClose }: OrderDetailModalProps) => {
  if (!order) return null;

  // Función para formatear fechas de la BD de forma segura
  const dateSafe = (date: any) => {
    if (!date) return "Sin fecha";
    try {
      return format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary flex items-center gap-3">
            Detalle de Pedido
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono">
              {order.orderNumber}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Grid de Información Principal */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-semibold text-foreground">{order.clientName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Teléfono</p>
              <p className="font-semibold text-foreground">{(order as any).clientPhone || "No registrado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha de creación</p>
              <p className="font-semibold text-foreground">
                {dateSafe((order as any).created_at || (order as any).createdAt)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha de entrega</p>
              <p className="font-semibold text-foreground">{dateSafe(order.deliveryDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-muted-foreground">Creado por</p>
              <p className="font-semibold text-foreground">{order.createdBy || "Sistema"}</p>
            </div>
          </div>

          {/* Descripción / Notas del Pedido */}
          {(order as any).descripcion && (
            <div className="text-sm bg-muted/20 p-3 rounded-md border border-dashed">
              <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Notas del Pedido</p>
              <p className="text-foreground italic">"{(order as any).descripcion}"</p>
            </div>
          )}

          {/* Lista de Productos */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground border-b pb-1">Productos del pedido</p>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <div key={item.id || idx} className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-foreground">{item.productName}</p>
                    <Badge variant="secondary" className="text-xs shrink-0 capitalize">
                      {serviceLabels[item.service?.toString().toLowerCase()] || item.service}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Cantidad</p>
                      <p className="font-medium">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Precio unitario</p>
                      <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Medidas</p>
                      <p className="font-medium">
                        {item.specifications?.height || "—"} x {item.specifications?.width || "—"} cm
                      </p>
                    </div>
                    {item.color && (
                      <div>
                        <p className="text-muted-foreground text-xs">Color</p>
                        <p className="font-medium">{item.color}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-muted-foreground/10">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Subtotal: </span>
                      <span className="font-bold text-primary">
                        {formatCurrency(Number(item.unitPrice) * item.quantity)}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-6 bg-muted/10 rounded-lg">
                No hay productos detallados cargados en este pedido.
              </p>
            )}
          </div>

          {/* Banner de Total */}
          <div className="flex items-center justify-between rounded-lg bg-primary p-4 text-primary-foreground shadow-sm">
            <span className="text-sm font-medium opacity-90">TOTAL GENERAL</span>
            <span className="text-2xl font-bold">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          <Button onClick={() => window.print()} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;