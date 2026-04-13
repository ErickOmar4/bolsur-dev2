import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Plus, Trash2, Save, Eye, Pencil, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Order, OrderStatus, ServiceType, Sale } from "@/types/order";
import { format, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import EditOrderModal from "@/components/orders/EditOrderModal";
import DeleteOrderDialog from "@/components/orders/DeleteOrderDialog";
import { PaymentModal } from "@/components/orders/PaymentModal";

interface DbService {
  id: number;
  nombre: string;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  "in-progress": "En proceso",
  finished: "Terminado",
  delivered: "Entregado",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

interface OrderItemForm {
  id: string;
  productId: number;
  productName: string;
  height: number;
  width: number;
  color: string;
  description: string;
  unitPrice: number;
  quantity: number;
  serviceId: string; 
}

const emptyItem: OrderItemForm = {
  id: "",
  productId: 0,
  productName: "",
  height: 0,
  width: 0,
  color: "",
  description: "",
  unitPrice: 0,
  quantity: 1,
  serviceId: "", 
};

interface OrdersTabProps {
  onOrderConverted?: (sale: Sale) => void;
}

const OrdersTab = ({ onOrderConverted }: OrdersTabProps) => {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<DbService[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState<OrderItemForm[]>([{ ...emptyItem, id: "1" }]);
  const [productSearch, setProductSearch] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>("1");

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const resetNewOrderForm = () => {
    setClientName("");
    setClientPhone("");
    setDeliveryDate("");
    setProductSearch("");
    setItems([{ ...emptyItem, id: "1" }]);
    setActiveItemId("1");
  };

  const fetchPedidos = async () => {
    try {
      setLoadingOrders(true);
      const response = await authFetch("http://localhost:4000/api/pedidos");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      toast.error("Error al cargar la lista de pedidos");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!showNewOrder) {
      resetNewOrderForm();
      fetchPedidos();
    } else {
      const loadFormData = async () => {
        try {
          setLoadingCatalog(true);
          const [prodRes, servRes] = await Promise.all([
            authFetch("http://localhost:4000/api/productos/disponibles"),
            authFetch("http://localhost:4000/api/pedidos/servicios")
          ]);
          if (prodRes.ok) setAvailableProducts(await prodRes.json());
          if (servRes.ok) setDbServices(await servRes.json());
        } catch (error) {
          toast.error("Error al cargar datos del catálogo");
        } finally {
          setLoadingCatalog(false);
        }
      };
      loadFormData();
    }
  }, [showNewOrder]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (filterDate) {
        const d = format(new Date(o.deliveryDate), "yyyy-MM-dd");
        if (d !== filterDate) return false;
      }
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        if (!o.orderNumber.toLowerCase().includes(q) && !o.clientName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, filterStatus, filterDate, filterSearch]);

  const isUrgent = (order: Order) => {
    if (order.status === "delivered") return false;
    return differenceInHours(new Date(order.deliveryDate), new Date()) < 48;
  };

  const filteredCatalog = useMemo(() => {
    if (!productSearch) return availableProducts;
    const q = productSearch.toLowerCase();
    return availableProducts.filter((p) => 
      p.nombre.toLowerCase().includes(q) || p.id.toString().includes(q)
    );
  }, [productSearch, availableProducts]);

  const selectProductForItem = (productId: string | number) => {
    const product = availableProducts.find((p) => p.id === productId);
    if (!product || !activeItemId) return;
    updateItem(activeItemId, {
      productId: product.id,
      productName: product.nombre,
      unitPrice: Number(product.precio_venta),
      height: Number(product.alto_cm) || 0,
      width: Number(product.ancho_cm) || 0,
      description: product.descripcion || "",
    });
    toast.success(`"${product.nombre}" seleccionado`);
  };

  const addItem = () => {
    const newId = Date.now().toString();
    setItems([...items, { ...emptyItem, id: newId }]);
    setActiveItemId(newId);
  };

  const removeItem = (id: string) => { 
    if (items.length > 1) { 
      setItems(items.filter((i) => i.id !== id)); 
      if (activeItemId === id) setActiveItemId(items.find((i) => i.id !== id)?.id || null); 
    } 
  };

  const updateItem = (id: string, updates: Partial<OrderItemForm>) => 
    setItems(items.map((i) => (i.id === id ? { ...i, ...updates } : i)));

  const orderTotal = useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [items]);

  const handleCreateOrder = async () => {
    if (!clientName || !clientPhone || !deliveryDate) {
      toast.error("Completa los campos requeridos");
      return;
    }
    if (items.some(i => i.productId === 0 || i.serviceId === "")) {
      toast.error("Selecciona producto y servicio para cada item");
      return;
    }
    try {
      const payload = {
        clientName,
        clientPhone,
        deliveryDate,
        totalAmount: orderTotal,
        description: items[0]?.description || "",
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          height: i.height,
          width: i.width,
          color: i.color,
          unitPrice: i.unitPrice,
          service: Number(i.serviceId)
        }))
      };
      const response = await authFetch("http://localhost:4000/api/pedidos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("Pedido registrado exitosamente");
        setShowNewOrder(false);
      } else {
        const err = await response.json();
        toast.error(err.error || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await authFetch(`http://localhost:4000/api/pedidos/${orderId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
        toast.success(`Estado actualizado a "${statusLabels[status]}"`);
      } else {
        const err = await response.json();
        toast.error(err.error || "Error al actualizar estado");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleSaveOrder = async (updated: Order) => {
  try {
    const response = await authFetch(`http://localhost:4000/api/pedidos/${updated.id}`, {
      method: "PUT",
      body: JSON.stringify(updated)
    });

    if (response.ok) {
      toast.success("Pedido actualizado con éxito");
      fetchPedidos();
      setEditingOrder(null);
    } else {
      const err = await response.json();
      toast.error(err.error || "Error al actualizar");
    }
  } catch (error) {
    toast.error("Error de conexión");
  }
};

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await authFetch(`http://localhost:4000/api/pedidos/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        toast.success("Pedido eliminado permanentemente");
      } else {
        const err = await response.json();
        toast.error(err.error || "No se pudo eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setDeletingOrder(null);
    }
  };

  if (!showNewOrder) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar pedido..." className="pl-9" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" className="w-44" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          <Button onClick={() => setShowNewOrder(true)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" /> Nuevo Pedido
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead># Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No se encontraron pedidos</TableCell></TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className={isUrgent(order) ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {isUrgent(order) && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {order.orderNumber}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.clientName}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(order.deliveryDate), "dd MMM yyyy", { locale: es })}</TableCell>
                      
                      {/* CELDA DE ESTADO CON PROPIEDAD DISABLED SI YA ESTÁ ENTREGADO */}
                      <TableCell>
                        <Select 
                            value={order.status} 
                            onValueChange={(v) => updateOrderStatus(order.id, v as OrderStatus)}
                            disabled={order.status === "delivered"}
                        >
                          <SelectTrigger className={`h-8 w-36 text-xs ${order.status === "delivered" ? "bg-muted opacity-80" : ""}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([k, v]) => {
                              const totalAbonado = (order as any).totalPaid || 0;
                              const saldoPendiente = order.totalAmount - totalAbonado;
                              const isDeliveredOption = k === "delivered";
                              const isDisabled = isDeliveredOption && saldoPendiente > 1;

                              return (
                                <SelectItem key={k} value={k} disabled={isDisabled}>
                                  <div className="flex flex-col">
                                    <span>{v}</span>
                                    {isDisabled && <span className="text-[10px] text-destructive font-bold">(Saldo pend.)</span>}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="text-right font-semibold text-primary">{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setViewingOrder(order)} title="Ver detalle"><Eye className="h-4 w-4" /></Button>
                          
                          {/* BOTONES PROHIBIDOS SI YA FUE ENTREGADO */}
                          {order.status !== "delivered" && (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingOrder(order)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingOrder(order)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                            </>
                          )}

                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => setPaymentOrder(order)} title="Abonos"><DollarSign className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <OrderDetailModal order={viewingOrder} open={!!viewingOrder} onClose={() => setViewingOrder(null)} />
        <EditOrderModal order={editingOrder} open={!!editingOrder} onClose={() => setEditingOrder(null)} onSave={handleSaveOrder} />
        <DeleteOrderDialog order={deletingOrder} open={!!deletingOrder} onClose={() => setDeletingOrder(null)} onConfirm={handleDeleteOrder} />
        {paymentOrder && (
          <PaymentModal open={!!paymentOrder} onOpenChange={(open) => !open && setPaymentOrder(null)} order={paymentOrder} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => setShowNewOrder(false)}>← Volver a pedidos</Button>
        <h2 className="text-lg font-semibold">Nuevo Pedido</h2>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Información del pedido</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+52 ..." />
            </div>
            <div className="space-y-2">
              <Label>Fecha de entrega *</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">Productos disponibles</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar producto..." className="pl-9" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-56 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCatalog ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4"><Loader2 className="animate-spin mx-auto h-5 w-5" /></TableCell></TableRow>
                ) : filteredCatalog.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.nombre}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.precio_venta)}</TableCell>
                    <TableCell className="text-right">{product.stock_actual}</TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="outline" onClick={() => selectProductForItem(product.id)} disabled={!activeItemId}>Seleccionar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Productos del pedido</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Agregar producto</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div key={item.id} className={`p-4 rounded-lg border space-y-4 cursor-pointer transition-colors ${activeItemId === item.id ? "border-primary bg-primary/5" : "bg-muted/30"}`} onClick={() => setActiveItemId(item.id)}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Producto {idx + 1}</span>
                {items.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <Input value={item.productName} readOnly placeholder="Selecciona del catálogo" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de servicio</Label>
                  <Select value={item.serviceId} onValueChange={(v) => updateItem(item.id, { serviceId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {dbServices.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2"><Label>Alto (cm)</Label><Input type="number" value={item.height || ""} onChange={(e) => updateItem(item.id, { height: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Ancho (cm)</Label><Input type="number" value={item.width || ""} onChange={(e) => updateItem(item.id, { width: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Color</Label><Input value={item.color} onChange={(e) => updateItem(item.id, { color: e.target.value })} placeholder="Ej: Rojo" /></div>
                <div className="space-y-2"><Label>Precio unitario</Label><Input type="number" step="0.01" value={item.unitPrice || ""} onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} rows={2} /></div>
              {item.unitPrice > 0 && (<div className="flex justify-end pt-2 border-t"><span className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span></div>)}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex justify-between items-center">
          <div><p className="text-sm text-muted-foreground">Total del pedido</p><p className="text-3xl font-bold text-primary">{formatCurrency(orderTotal)}</p></div>
          <Button size="lg" onClick={handleCreateOrder}><Save className="h-5 w-5 mr-2" /> Crear Pedido</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersTab;