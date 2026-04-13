import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Printer, 
  Mail, 
  Phone, 
  Calendar, 
  User,
  Package,
  FileText,
  Edit,
  Ruler,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { OrderStatus } from "@/types/order";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus>('pending');

  const isDelivered = order?.statusId === 4 || status === 'delivered';

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/dashboard/orders/${id}`);
        if (!response.ok) throw new Error("Pedido no encontrado");
        const data = await response.json();
        
        setOrder(data);
        setStatus(data.status);
      } catch (error) {
        console.error("Error cargando pedido:", error);
        toast.error("Error al conectar con la base de datos");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const serviceLabels: Record<string, string> = {
    'serigrafia': 'Serigrafía',
    'sublimacion': 'Sublimación',
    'dtf': 'DTF',
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (isDelivered) return;

    try {
      const response = await authFetch(`http://localhost:4000/api/pedidos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }) 
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(newStatus);
        toast.success(data.message || "Estado actualizado");
        
        if (newStatus === 'delivered') {
          toast.info("Pedido finalizado, se ha generado la venta.");
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        toast.error(data.error || "No se pudo actualizar el estado");
      }
    } catch (error) {
      console.error("Error en handleStatusChange:", error);
      toast.error("Error de conexión con el servidor");
    }
  };

  const handlePrint = () => toast.success("Preparando ticket para imprimir...");
  
  const handleEmail = () => {
    if (order?.clientEmail) {
      toast.success(`Enviando ticket a ${order.clientEmail}`);
    } else {
      toast.error("El cliente no tiene correo registrado");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Cargando pedido...">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-2 font-medium">Consultando Bolsur...</p>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout title="Pedido no encontrado">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Pedido no encontrado</h2>
          <Button onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a pedidos
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Pedido ${order.orderNumber}`}>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{order.orderNumber}</h1>
                <StatusBadge status={status} />
              </div>
              <p className="text-muted-foreground">
                Creado el {order.createdAt ? format(new Date(order.createdAt), "dd 'de' MMMM, yyyy", { locale: es }) : '---'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-12 sm:ml-0">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
            {/* Botón Enviar Restaurado */}
            <Button variant="outline" onClick={handleEmail}>
              <Mail className="h-4 w-4 mr-2" /> Enviar
            </Button>
            <Button variant="outline" disabled={isDelivered}>
              <Edit className="h-4 w-4 mr-2" />
              {isDelivered ? "Finalizado" : "Editar"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" /> Información del Cliente
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{order.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {order.clientPhone || 'Sin teléfono'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" /> Productos y Servicios
              </h3>
              <div className="space-y-4">
                {order.items?.map((item: any, index: number) => (
                  <div key={item.id || index} className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {serviceLabels[item.service] || item.service}
                        </Badge>
                      </div>
                      <p className="font-semibold text-foreground">{formatCurrency(item.quantity * item.unitPrice)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cantidad</p>
                        <p className="font-medium">{item.quantity} unidades</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Precio unitario</p>
                        <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <span className="text-lg font-medium">Total del pedido</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {order.notes && (
              <div className="bg-card rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" /> Notas
                </h3>
                <p className="text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4">Actualizar Estado</h3>
              <Select value={status} onValueChange={(value) => handleStatusChange(value as OrderStatus)} disabled={isDelivered}>
                <SelectTrigger className={isDelivered ? "bg-muted cursor-not-allowed" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in-progress">En Proceso</SelectItem>
                  <SelectItem value="finished">Terminado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                </SelectContent>
              </Select>
              {isDelivered && (
                <p className="text-[10px] text-status-finished mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Pedido entregado y cerrado.
                </p>
              )}
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" /> Fechas
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de creación</p>
                  <p className="font-medium">{order.createdAt ? format(new Date(order.createdAt), "dd 'de' MMMM, yyyy", { locale: es }) : '---'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de entrega</p>
                  <p className="font-medium text-primary">{order.deliveryDate ? format(new Date(order.deliveryDate), "dd 'de' MMMM, yyyy", { locale: es }) : '---'}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4">Equipo</h3>
              <p className="text-sm text-muted-foreground">Creado por</p>
              <p className="font-medium">{order.createdBy || 'Sistema'}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default OrderDetail;