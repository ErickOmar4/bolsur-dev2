import { useState, useEffect } from "react";
import { Order } from "@/types/order";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, Trash2, Loader2 } from "lucide-react"; // Añadido Loader2 para estados de carga
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner"; // Cambiado a sonner para consistencia con tu proyecto
import { useAuth } from "@/contexts/AuthContext";

interface Payment {
  id: string; // En BD será el id_pago
  number: number;
  amount: number;
  date: Date;
  description: string;
  method: string;
}

interface MetodoPago {
  id: number;
  nombre: string;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export function PaymentModal({ open, onOpenChange, order }: PaymentModalProps) {
  const { authFetch } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [metodosDb, setMetodosDb] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState(""); // Guardará el ID numérico
  const [showForm, setShowForm] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = order.totalAmount - totalPaid;

  const fmt = (v: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v);

  // Cargar abonos y métodos de la BD al abrir
  useEffect(() => {
    if (open && order?.id) {
      fetchData();
    }
  }, [open, order]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        authFetch(`http://localhost:4000/api/pagos/${order.id}/historial-pagos`),
        authFetch(`http://localhost:4000/api/pagos/metodos-pago`)
      ]);
      
      if (pRes.ok) {
        const data = await pRes.json();
        setPayments(data.map((p: any, index: number) => ({
          id: p.id_pago,
          number: data.length - index,
          amount: Number(p.monto),
          date: new Date(p.fecha_pago),
          description: p.referencia || "Abono",
          method: p.metodo_nombre
        })));
      }

      if (mRes.ok) {
        const metodos = await mRes.json();
        setMetodosDb(metodos);
        if (metodos.length > 0) setMethod(metodos[0].id.toString());
      }
    } catch (error) {
      toast.error("Error al sincronizar con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (num > balance + 0.01) {
      toast.error("El monto excede el saldo pendiente");
      return;
    }

    try {
      const response = await authFetch("http://localhost:4000/api/pagos/registrar-pago", {
        method: "POST",
        body: JSON.stringify({
          pedido_id: order.id,
          monto: num,
          metodo_pago_id: parseInt(method),
          referencia: description,
          fecha_pago: date,
          tipo: num >= balance ? "LIQUIDACION" : "ABONO"
        })
      });

      if (response.ok) {
        toast.success(`Se registró un abono de ${fmt(num)}.`);
        setAmount("");
        setDescription("");
        setShowForm(false);
        fetchData(); // Recargar historial real
      }
    } catch (error) {
      toast.error("Error al registrar abono");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas eliminar este abono de la base de datos?")) return;
    try {
      const response = await authFetch(`http://localhost:4000/api/pagos/pago/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Abono eliminado");
        fetchData();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-accent" />
            Abonos del pedido
          </DialogTitle>
        </DialogHeader>

        {/* Order info */}
        <div className="px-6 pb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Cliente</span>
          <span className="font-medium text-foreground">{order.clientName}</span>
          <span className="text-muted-foreground">Pedido</span>
          <span className="font-medium text-foreground">{order.orderNumber}</span>
        </div>

        {/* Payments table */}
        <div className="px-6">
          <ScrollArea className="max-h-[220px]">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
            ) : payments.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Monto</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Descripción</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Método</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="py-2 px-3 text-muted-foreground">{p.number}</td>
                      <td className="py-2 px-3 font-medium text-foreground">{fmt(p.amount)}</td>
                      <td className="py-2 px-3 text-muted-foreground">{format(p.date, "dd/MM/yyyy", { locale: es })}</td>
                      <td className="py-2 px-3 text-muted-foreground">{p.description}</td>
                      <td className="py-2 px-3 text-muted-foreground">{p.method}</td>
                      <td className="py-2 px-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">No hay abonos registrados</div>
            )}
          </ScrollArea>
        </div>

        {/* Add payment form */}
        {balance > 0 && (
          <div className="px-6 py-4 border-t mt-2">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <DollarSign className="h-4 w-4 mr-2" />
                Abonar
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Registrar abono</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Monto</Label>
                    <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} max={balance} step="0.01" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fecha</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descripción / Referencia</Label>
                    <Input placeholder="Ej: Anticipo, Depósito" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Método de pago</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {metodosDb.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddPayment} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Abonar
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Financial summary */}
        <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total del pedido</span>
              <span className="font-semibold text-foreground">{fmt(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total abonado</span>
              <span className="font-semibold text-accent">{fmt(totalPaid)}</span>
            </div>
            <div className="border-t pt-1.5 flex justify-between">
              <span className="font-medium text-foreground">Saldo faltante</span>
              <span className={`font-bold ${balance > 0 ? "text-destructive" : "text-accent"}`}>{fmt(balance)}</span>
            </div>
          </div>
          {balance <= 0 && payments.length > 0 && (
            <p className="text-sm font-medium text-accent text-center mt-3">✓ Pedido pagado en su totalidad</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}