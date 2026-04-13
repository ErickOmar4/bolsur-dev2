import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { Order, ServiceType } from "@/types/order";
import { useState, useEffect, useMemo } from "react";

const serviceLabels: Record<ServiceType, string> = {
  serigrafia: "Serigrafía",
  sublimacion: "Sublimación",
  dtf: "DTF",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

// 1. CORRECCIÓN: Agregamos productId a la interface para que TS no chille
interface ItemForm {
  id: string;
  productId: number; 
  productName: string;
  quantity: number;
  unitPrice: number;
  service: ServiceType;
  color: string;
  height: number;
  width: number;
  description: string;
}

interface EditOrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
}

const EditOrderModal = ({ order, open, onClose, onSave }: EditOrderModalProps) => {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemForm[]>([]);

  useEffect(() => {
    if (order) {
      setClientName(order.clientName || "");
      setClientPhone((order as any).clientPhone || order.clientPhone || "");
      
      if (order.deliveryDate) {
        try {
          const d = new Date(order.deliveryDate);
          setDeliveryDate(d.toISOString().split("T")[0]);
        } catch (e) {
          setDeliveryDate("");
        }
      }

      setNotes((order as any).descripcion || order.descripcion || "");

      if (order.items && Array.isArray(order.items)) {
        setItems(
          order.items.map((i) => ({
            id: i.id || Math.random().toString(),
            // 2. CORRECCIÓN: Aseguramos que el ID del producto se mantenga
            productId: (i as any).productId || (i as any).producto_id || 0,
            productName: i.productName || "",
            quantity: i.quantity || 0,
            unitPrice: i.unitPrice || 0,
            service: (i.service as ServiceType) || "serigrafia",
            color: i.color || "",
            height: i.specifications?.height || 0,
            width: i.specifications?.width || 0,
            description: i.specifications?.notes || "",
          }))
        );
      } else {
        setItems([]);
      }
    }
  }, [order]);

  const total = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items]);

  const updateItem = (id: string, updates: Partial<ItemForm>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      // 3. CORRECCIÓN: Los productos nuevos inician con productId 0
      { id: Date.now().toString(), productId: 0, productName: "", quantity: 1, unitPrice: 0, service: "serigrafia", color: "", height: 0, width: 0, description: "" },
    ]);

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    if (!order) return;
    const updated: any = {
      ...order,
      clientName,
      clientPhone,
      deliveryDate: new Date(deliveryDate),
      descripcion: notes, 
      totalAmount: total,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId, // Ahora esto ya no marcará error
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        service: i.service,
        color: i.color || "",
        specifications: {
          height: i.height || 0,
          width: i.width || 0,
          notes: i.description || "",
        },
      })),
    };
    onSave(updated);
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            Editar Pedido — {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de entrega</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas del pedido..." />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Productos</Label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={item.id} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Producto {idx + 1}</span>
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Producto</Label>
                    <Input value={item.productName} onChange={(e) => updateItem(item.id, { productName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Servicio</Label>
                    <Select value={item.service} onValueChange={(v) => updateItem(item.id, { service: v as ServiceType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(serviceLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Color</Label>
                    <Input value={item.color} onChange={(e) => updateItem(item.id, { color: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Alto (cm)</Label>
                    <Input type="number" value={item.height || ""} onChange={(e) => updateItem(item.id, { height: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ancho (cm)</Label>
                    <Input type="number" value={item.width || ""} onChange={(e) => updateItem(item.id, { width: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Precio unit.</Label>
                    <Input type="number" step="0.01" value={item.unitPrice || ""} onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descripción</Label>
                  <Textarea value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} rows={2} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-primary/5 p-4">
            <span className="text-sm font-medium text-muted-foreground">Total del pedido</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Save className="h-4 w-4 mr-2" /> Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderModal;