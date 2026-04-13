import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import EditProductModal from "@/components/inventory/EditProductModal";
import NewProductModal from "@/components/inventory/NewProductModal";
import { Product } from "@/types/order";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Package, AlertTriangle, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  nombre: string;
}

type StockStatus = "ok" | "low" | "critical";

const getStockStatus = (stock: number, minStock: number): StockStatus => {
  if (stock <= minStock * 0.5) return "critical";
  if (stock <= minStock) return "low";
  return "ok";
};

const statusConfig: Record<StockStatus, { label: string; className: string }> = {
  ok: { label: "Stock OK", className: "bg-accent/15 text-accent border-accent/30" },
  low: { label: "Bajo", className: "bg-[hsl(var(--status-pending)/0.15)] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending)/0.3)]" },
  critical: { label: "Crítico", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const InventoryPage = () => {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          authFetch("http://localhost:4000/api/productos/inventario"),
          authFetch("http://localhost:4000/api/categorias")
        ]);

        if (prodRes.ok) setProducts(await prodRes.json());
        if (catRes.ok) setDbCategories(await catRes.json());
      } catch (error) {
        toast.error("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Estas funciones solo actualizan el estado visual después de que el Modal hizo el trabajo pesado
  const handleSaveProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProduct(null);
  };

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    setShowNewProduct(false);
  };

  const handleDeleteProduct = async (id: number | string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${name}"?`)) return;

    try {
      const response = await authFetch(`http://localhost:4000/api/productos/${id}/desactivar`, {
        method: "PATCH",
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => Number(p.id) !== Number(id)));
        toast.success(`"${name}" eliminado correctamente`);
      } else {
        const data = await response.json();
        toast.error(data.error || "No se pudo eliminar");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.id.toString().includes(query)
      );
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (stockFilter !== "all") {
      filtered = filtered.filter((p) => getStockStatus(p.stock, p.minStock) === stockFilter);
    }
    return filtered;
  }, [searchQuery, categoryFilter, stockFilter, products]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <AppLayout title="Inventario">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
            <p className="text-muted-foreground">
              {loading ? "Cargando..." : `${filteredProducts.length} productos registrados`}
            </p>
          </div>
          <Button onClick={() => setShowNewProduct(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Alerta Stock Bajo */}
        {!loading && lowStockCount > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Stock bajo detectado</p>
              <p className="text-sm text-destructive/80">{lowStockCount} productos requieren atención.</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-card rounded-xl border shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {dbCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ok">Stock OK</SelectItem>
                  <SelectItem value="low">Bajo</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Medidas</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10">No se encontraron productos.</TableCell></TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock, product.minStock);
                  const config = statusConfig[status];
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs">#{product.id}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                      <TableCell className="text-center text-sm">
                        {product.dimensions ? `${product.dimensions.height}x${product.dimensions.width}` : "—"}
                      </TableCell>
                      <TableCell className={cn("text-center font-bold", status !== 'ok' && "text-destructive")}>
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-[10px] uppercase", config.className)} variant="outline">{config.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id, product.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modales - Corregido el paso de categorías como objeto */}
        {editingProduct && (
          <EditProductModal
            product={editingProduct}
            open={!!editingProduct}
            categories={dbCategories} // Objeto completo: [{id, nombre}, ...]
            onClose={() => setEditingProduct(null)}
            onSave={handleSaveProduct}
          />
        )}

        <NewProductModal
          open={showNewProduct}
          categories={dbCategories} // Objeto completo
          onClose={() => setShowNewProduct(false)}
          onSave={handleAddProduct}
        />
      </div>
    </AppLayout>
  );
};

export default InventoryPage;