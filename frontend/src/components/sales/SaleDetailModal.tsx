import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Printer, X } from "lucide-react";
import { Sale } from "@/types/order";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

interface SaleDetailModalProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}

const SaleDetailModal = ({ sale, open, onClose }: SaleDetailModalProps) => {
  if (!sale) return null;

  const handlePrint = () => {
  if (sale?.id) {
    // Abrimos la ruta que renderiza el TicketPrinter
    // Asegúrate de que en App.tsx la ruta sea exactamente /imprimir-ticket/:ventaId
    window.open(`/imprimir-ticket/${sale.id}`, '_blank');
  }
};

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary flex items-center gap-3">
            Detalle de Venta
            <Badge variant="outline" className="bg-accent/15 text-accent border-accent/30 font-mono">
              {sale.saleNumber}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-semibold text-foreground">{sale.clientName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha</p>
              <p className="font-semibold text-foreground">
                {format(sale.date, "dd MMMM yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <Badge className="bg-accent/15 text-accent border-accent/30">Completada</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Registrada por</p>
              <p className="font-semibold text-foreground">{sale.createdBy}</p>
            </div>
          </div>

          {/* Products table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Precio unitario</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale?.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg bg-primary/5 p-4">
            <span className="text-sm font-medium text-muted-foreground">Total general</span>
            <span className="text-2xl font-bold text-accent">{formatCurrency(sale.totalAmount)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaleDetailModal;
