import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Loader2 } from "lucide-react";
import { Product } from "@/types/order";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Category {
  id: number;
  nombre: string;
}

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onSave: (updated: Product) => void;
}

const EditProductModal = ({ product, open, categories, onClose, onSave }: EditProductModalProps) => {
  const { authFetch } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    height: "",
    width: "",
    stock: "",
    minStock: "",
    unitPrice: "",
  });

  useEffect(() => {
    if (product && open) {
      const currentCategory = categories.find((c) => c.nombre === product.category);
      setForm({
        name: product.name,
        category_id: currentCategory?.id.toString() ?? "",
        height: product.dimensions?.height?.toString() ?? "",
        width: product.dimensions?.width?.toString() ?? "",
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        unitPrice: product.unitPrice.toString(),
      });
    }
  }, [product, open, categories]);

  const handleSave = async () => {
    if (!product) return;

    if (!form.name.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    if (!form.category_id) {
      toast.error("Debes seleccionar una categoría");
      return;
    }

    setIsSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        category_id: Number(form.category_id),
        unitPrice: Number(form.unitPrice),
        stock: Number(form.stock),
        minStock: Number(form.minStock),
        height: Number(form.height),
        width: Number(form.width),
      };

      const response = await authFetch(`http://localhost:4000/api/productos/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        const selectedCatName = categories.find((c) => c.id === Number(form.category_id))?.nombre;
        const updated: Product = {
          ...product,
          name: body.name,
          category: selectedCatName || product.category,
          stock: body.stock,
          minStock: body.minStock,
          unitPrice: body.unitPrice,
          dimensions: {
            height: body.height,
            width: body.width,
            unit: product.dimensions?.unit ?? "cm",
          },
        };
        onSave(updated);
        toast.success("Producto actualizado");
      } else if (response.status === 409) {
        toast.error(data.error);
      } else {
        toast.error(data.error || "Error al actualizar");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // FIX: ya no hay "if (!product) return null" — el modal siempre se renderiza
    // pero open=false lo mantiene invisible. Esto evita que Radix intente
    // desmontar su portal mientras el nodo DOM ya fue removido por React.
    <Dialog open={open} onOpenChange={(v) => !v && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">Editar Producto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nombre del producto</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isSaving}
            />
          </div>

          <div>
            <Label>Categoría</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-height">Alto (cm)</Label>
              <Input
                id="edit-height"
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="edit-width">Ancho (cm)</Label>
              <Input
                id="edit-width"
                type="number"
                value={form.width}
                onChange={(e) => setForm({ ...form, width: e.target.value })}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-stock">Stock actual</Label>
              <Input
                id="edit-stock"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="edit-minStock">Stock mínimo</Label>
              <Input
                id="edit-minStock"
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-price">Precio unitario (MXN)</Label>
            <Input
              id="edit-price"
              type="number"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;