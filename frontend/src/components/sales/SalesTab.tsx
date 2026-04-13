import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Plus, Trash2, ShoppingCart, CheckCircle, Eye, Printer, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Sale } from "@/types/order";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SaleDetailModal from "./SaleDetailModal";
import SendTicketModal from "./SendTicketModal";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  height: string | number;
  width: string | number;
  price: number;
  color: string;
  description: string;
  quantity: number;
}

interface ProductForm {
  productId: string;
  name: string;
  height: string | number;
  width: string | number;
  color: string;
  price: number;
  description: string;
  quantity: string; 
}

const emptyForm: ProductForm = {
  productId: "",
  name: "",
  height: "",
  width: "",
  color: "",
  price: 0,
  description: "",
  quantity: "", 
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

const formatDimension = (dim: any) => {
  const val = parseFloat(dim);
  if (isNaN(val) || val === 0) return "No aplica";
  return `${val} cm`;
};

const SalesTab = ({ extraSales = [] }: { extraSales?: Sale[] }) => {
  const { authFetch, user } = useAuth();
  
  const [showNewSale, setShowNewSale] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  
  // Estado para el historial real de la base de datos
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const allSales = useMemo(() => [...extraSales, ...sales], [extraSales, sales]);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [emailingSale, setEmailingSale] = useState<Sale | null>(null);

  const [productosDb, setProductosDb] = useState<any[]>([]);
  const [loadingProds, setLoadingProds] = useState(false);

  // Cargar historial de ventas reales
  useEffect(() => {
    const fetchVentas = async () => {
      if (showNewSale) return;
      setLoadingHistory(true);
      try {
        const res = await authFetch("http://localhost:4000/api/ventas");
        if (res.ok) {
          const data = await res.json();
          setSales(data);
        }
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchVentas();
  }, [showNewSale, authFetch]);

  // Cargar productos para nueva venta
  useEffect(() => {
    if (showNewSale) {
      const fetchProds = async () => {
        setLoadingProds(true);
        try {
          const res = await authFetch("http://localhost:4000/api/productos/disponibles");
          if (res.ok) {
            const data = await res.json();
            setProductosDb(data);
          }
        } catch (error) {
          console.error("Error cargando productos:", error);
        } finally {
          setLoadingProds(false);
        }
      };
      fetchProds();
    }
  }, [showNewSale, authFetch]);

  const [filterDate, setFilterDate] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const filteredSales = useMemo(() => {
    return allSales.filter((s) => {
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        if (!s.saleNumber?.toLowerCase().includes(q) && !s.clientName?.toLowerCase().includes(q)) return false;
      }
      if (filterDate) {
        const d = format(new Date(s.date), "yyyy-MM-dd");
        if (d !== filterDate) return false;
      }
      return true;
    });
  }, [allSales, filterSearch, filterDate]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return productosDb;
    const q = searchQuery.toLowerCase();
    return productosDb.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.id.toString().includes(q)
    );
  }, [searchQuery, productosDb]);

  const selectProduct = (productId: string) => {
    const product = productosDb.find((p) => p.id.toString() === productId);
    if (!product || product.stock_actual <= 0) return;
    
    setSelectedProductId(productId);
    setForm({
      productId: product.id.toString(),
      name: product.nombre,
      height: product.alto_cm,
      width: product.ancho_cm,
      color: "",
      price: parseFloat(product.precio_venta) || 0,
      description: product.descripcion || "",
      quantity: "1", 
    });
  };

  const addToCart = () => {
    const productInDb = productosDb.find(p => p.id.toString() === form.productId);
    const qtyNum = parseInt(form.quantity);
    
    if (!form.productId) {
      toast.error("Selecciona un producto de la tabla");
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("Ingresa una cantidad válida");
      return;
    }

    if (productInDb && qtyNum > productInDb.stock_actual) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${productInDb.stock_actual} disponibles.`
      });
      return;
    }

    setCart((prev) => [
      ...prev,
      { 
        id: Date.now().toString(), 
        productId: form.productId, 
        name: form.name, 
        height: formatDimension(form.height), 
        width: formatDimension(form.width), 
        price: form.price, 
        color: form.color || "Sin especificar", 
        description: form.description, 
        quantity: qtyNum 
      },
    ]);

    setForm(emptyForm);
    setSelectedProductId(null);
    toast.success("Producto añadido");
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((item) => item.id !== id));
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const finalizeSale = async () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    try {
      const ventaData = {
        cliente_id: clientName.trim() === "" ? 1 : null, 
        clientName: clientName.trim(),
        total: cartTotal,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const res = await authFetch("http://localhost:4000/api/ventas", {
        method: "POST",
        body: JSON.stringify(ventaData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Venta registrada", {
          description: `Folio: ${data.numero_venta} — Total: ${formatCurrency(cartTotal)}`,
        });

        if (data.ventaId && user?.imprimir_automatico) {
          const ticketUrl = `/imprimir-ticket/${data.ventaId}`;
          window.open(ticketUrl, '_blank');
        }

        setCart([]);
        setForm(emptyForm);
        setSelectedProductId(null);
        setClientName("");
        setShowNewSale(false);

      } else {
        toast.error("No se pudo registrar la venta", {
          description: data.error || "Error desconocido en el servidor"
        });
      }
    } catch (error) {
      console.error("Error en el proceso de venta:", error);
      toast.error("Error de conexión");
    }
  };


  const handleViewSaleDetail = async (sale) => {
  try {
    const res = await authFetch(`http://localhost:4000/api/ventas/${sale.id}`);
    const fullSaleData = await res.json();

    if (res.ok) {
      // IMPORTANTE: Verifica en la consola qué está llegando exactamente
      console.log("Datos recibidos del backend:", fullSaleData);
      setViewingSale(fullSaleData);
    }
  } catch (error) {
    console.error("Error cargando detalle:", error);
  }
};

  const currentMaxStock = productosDb.find(p => p.id.toString() === form.productId)?.stock_actual || 0;

  if (!showNewSale) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar venta..." className="pl-9" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
            </div>
            <Input type="date" className="w-44" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <Button onClick={() => setShowNewSale(true)} className="bg-[hsl(var(--status-finished))] hover:bg-[hsl(var(--status-finished))]/90 text-white">
            <Plus className="h-4 w-4 mr-2" /> Nueva Venta
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 font-semibold">
                  <TableHead># Venta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Resumen</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHistory ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-8 w-8 text-muted-foreground" /></TableCell></TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No hay registros de ventas.</TableCell></TableRow>
                ) : filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">{sale.saleNumber}</TableCell>
                    <TableCell className="font-medium">{sale.clientName}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(sale.date), "dd MMM yyyy", { locale: es })}</TableCell>
                    <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]">
                      {sale.items?.map(i => i.productName).join(", ") || "Sin detalle"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[hsl(var(--status-finished))]">{formatCurrency(sale.totalAmount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewSaleDetail(sale)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/imprimir-ticket/${sale.id}`, '_blank')}><Printer className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEmailingSale(sale)}><Mail className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <SaleDetailModal sale={viewingSale} open={!!viewingSale} onClose={() => setViewingSale(null)} />
        <SendTicketModal sale={emailingSale} open={!!emailingSale} onClose={() => setEmailingSale(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => { setShowNewSale(false); setCart([]); setForm(emptyForm); }}>
          ← Cancelar Venta
        </Button>
        <h2 className="text-lg font-semibold tracking-tight">Registro de Venta Inmediata</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-sm">
            <Label>Identificación del Cliente</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre o dejar vacío (Público Gral.)" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Catálogo en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 text-[11px] uppercase">
                  <TableHead>ID</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Medidas</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Existencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProds ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredProducts.map((p) => {
                  const out = p.stock_actual <= 0;
                  return (
                    <TableRow
                      key={p.id}
                      className={`${out ? "opacity-30 cursor-not-allowed bg-muted/20" : "cursor-pointer hover:bg-muted/30"} ${selectedProductId === p.id.toString() ? "bg-[hsl(var(--status-finished))]/10" : ""}`}
                      onClick={() => !out && selectProduct(p.id.toString())}
                    >
                      <TableCell className="font-mono text-[10px]">{p.id}</TableCell>
                      <TableCell className="text-sm font-medium">{p.nombre}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{formatDimension(p.alto_cm)} x {formatDimension(p.ancho_cm)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatCurrency(p.precio_venta)}</TableCell>
                      <TableCell className={`text-right font-bold ${out ? "text-destructive" : ""}`}>{p.stock_actual}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className={form.productId ? "ring-1 ring-[hsl(var(--status-finished))]/30 shadow-md" : ""}>
        <CardHeader>
          <CardTitle className="text-lg">Configuración de Línea de Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Cantidad</Label>
                {form.productId && <span className="text-[10px] font-bold text-muted-foreground uppercase">Stock Máx: {currentMaxStock}</span>}
              </div>
              <Input 
                type="text" 
                value={form.quantity} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^[0-9]+$/.test(val)) {
                    setForm((f) => ({ ...f, quantity: val }));
                  }
                }} 
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Precio Unitario</Label>
              <Input value={form.price > 0 ? formatCurrency(form.price) : ""} readOnly className="bg-muted/50 font-bold" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Alto</Label>
              <Input value={form.productId ? formatDimension(form.height) : ""} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Ancho</Label>
              <Input value={form.productId ? formatDimension(form.width) : ""} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Color / Variante</Label>
              <Input 
                value={form.color} 
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} 
                placeholder="Especificar color"
                className={form.productId ? "border-[hsl(var(--status-finished))]/50" : ""}
              />
            </div>
          </div>
          <div className="flex justify-between items-end pt-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Subtotal línea: </span>
              <span className="font-bold text-lg">{formatCurrency(form.price * (parseInt(form.quantity) || 0))}</span>
            </div>
            <Button onClick={addToCart} disabled={!form.productId} className="bg-[hsl(var(--status-finished))] hover:bg-[hsl(var(--status-finished))]/90 text-white">
              <Plus className="h-4 w-4 mr-2" /> Agregar al Carrito
            </Button>
          </div>
        </CardContent>
      </Card>

      {cart.length > 0 && (
        <Card className="border-[hsl(var(--status-finished))] border-t-4 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[hsl(var(--status-finished))] uppercase">
              <ShoppingCart className="h-5 w-5" /> Detalle del Carrito
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 text-xs">
                  <TableHead>Descripción</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-xs italic">{item.color}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(item.price * item.quantity)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-muted/5">
            <div className="text-center sm:text-left">
              <p className="text-xs uppercase text-muted-foreground tracking-widest">Total de la Venta</p>
              <p className="text-4xl font-black text-[hsl(var(--status-finished))]">{formatCurrency(cartTotal)}</p>
            </div>
            <Button size="lg" onClick={finalizeSale} className="bg-[hsl(var(--status-finished))] hover:bg-[hsl(var(--status-finished))]/90 text-white w-full sm:w-auto h-16 text-lg px-8">
              <CheckCircle className="h-6 w-6 mr-2" /> Confirmar Pago
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SalesTab;