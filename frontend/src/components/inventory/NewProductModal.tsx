import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Save, X, Loader2 } from "lucide-react";
import { Product } from "@/types/order";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Interfaz para las categorías que vienen de la BD
interface Category {
  id: number;
  nombre: string;
}

interface NewProductModalProps {
  open: boolean;
  categories: Category[]; // Recibe el objeto completo [{id, nombre}]
  onClose: () => void;
  onSave: (product: Product) => void;
}

const NewProductModal = ({ open, categories, onClose, onSave }: NewProductModalProps) => {
  const { authFetch } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    unitPrice: "",
    stock: "",
    minStock: "",
    height: "",
    width: "",
    description: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      sku: "",
      category_id: "",
      unitPrice: "",
      stock: "",
      minStock: "",
      height: "",
      width: "",
      description: "",
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.category_id) {
      toast.error("El nombre y la categoría son obligatorios");
      return;
    }

    setIsSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        category_id: Number(form.category_id),
        unitPrice: Number(form.unitPrice) || 0,
        stock: Number(form.stock) || 0,
        minStock: Number(form.minStock) || 0,
        height: Number(form.height) || 0,
        width: Number(form.width) || 0,
        description: form.description,
      };

      const response = await authFetch("http://localhost:4000/api/productos", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // Obtenemos el nombre de la categoría para actualizar la tabla visualmente
        const catName = categories.find(c => c.id === body.category_id)?.nombre;

        const newProduct: Product = {
          ...data.producto, // ID generado por PostgreSQL
          category: catName || "Sin categoría",
          dimensions: {
            height: body.height,
            width: body.width,
            unit: "cm"
          }
        };

        onSave(newProduct);
        toast.success(`Producto "${body.name}" registrado con éxito`);
        resetForm();
        onClose();
      } else if (response.status === 409) {
        toast.error(data.error); // Error: "El producto ya existe"
      } else {
        toast.error(data.error || "Error al registrar el producto");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            Nuevo Producto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Información básica */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Información básica</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="np-name">Nombre del producto *</Label>
                <Input
                  id="np-name"
                  placeholder="Ej: Bolsas Kraft 30x40"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="np-sku">SKU</Label>
                  <Input
                    id="np-sku"
                    placeholder="Autogenerado"
                    value={form.sku}
                    disabled={true} // Bloqueado ya que lo genera la BD
                    className="bg-muted/50 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label>Categoría *</Label>
                  <Select 
                    value={form.category_id} 
                    onValueChange={(v) => setForm({ ...form, category_id: v })}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="np-price">Precio unitario (MXN)</Label>
                <Input
                  id="np-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Stock */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Inventario</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="np-stock">Stock inicial</Label>
                <Input
                  id="np-stock"
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="np-minstock">Stock mínimo</Label>
                <Input
                  id="np-minstock"
                  type="number"
                  placeholder="0"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Medidas */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Medidas</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="np-height">Alto (cm)</Label>
                <Input
                  id="np-height"
                  type="number"
                  placeholder="0"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="np-width">Ancho (cm)</Label>
                <Input
                  id="np-width"
                  type="number"
                  placeholder="0"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Descripción */}
          <div>
            <Label htmlFor="np-desc">Descripción (opcional)</Label>
            <Textarea
              id="np-desc"
              placeholder="Descripción del producto..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.name || !form.category_id || isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar producto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProductModal;