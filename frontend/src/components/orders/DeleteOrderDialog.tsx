import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Order } from "@/types/order";

interface DeleteOrderDialogProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

const DeleteOrderDialog = ({ order, open, onClose, onConfirm }: DeleteOrderDialogProps) => {
  if (!order) return null;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar pedido {order.orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará el pedido de <strong>{order.clientName}</strong>. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={() => {
              onConfirm(order.id);
              onClose();
            }}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteOrderDialog;
