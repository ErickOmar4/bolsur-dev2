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
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Send, X } from "lucide-react";
import { Sale } from "@/types/order";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

interface SendTicketModalProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}

const SendTicketModal = ({ sale, open, onClose }: SendTicketModalProps) => {
  const { authFetch } = useAuth();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");

  const resetForm = () => {
    setEmail("");
    setSubject("");
    setMessage("");
    setAttachPdf(true);
    setEmailError("");
    setSending(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      resetForm();
      onClose();
    }
  };

  // Set defaults when sale changes
  const getDefaultSubject = () =>
    sale ? `Ticket de compra - ${sale.saleNumber}` : "";

  const getDefaultMessage = () =>
    sale
      ? `Estimado/a ${sale.clientName},\n\nAdjunto encontrará el ticket de su compra ${sale.saleNumber} por un total de ${formatCurrency(sale.totalAmount)}.\n\nGracias por su preferencia.`
      : "";

  // Initialize fields when modal opens with a sale
  if (sale && !subject && !message) {
    setSubject(getDefaultSubject());
    setMessage(getDefaultMessage());
  }

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError("El correo electrónico es obligatorio");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Formato de correo electrónico inválido");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSend = async () => {
  if (!validateEmail(email)) return;
  if (!sale) return;

  setSending(true);

  try {
    const response = await authFetch("http://localhost:4000/api/ventas/enviar-ticket", {
      method: "POST",
      body: JSON.stringify({
        saleId: sale.id,
        email: email,
        subject: subject,
        message: message,
        attachPdf: attachPdf,
      }),
    });

    if (response.ok) {
      toast.success("Ticket enviado exitosamente", {
        description: `Se envió el ticket a ${email}`,
      });
      onClose();
      resetForm();
    } else {
      throw new Error("Error al procesar el envío");
    }
  } catch (error) {
    toast.error("Error al enviar el correo");
    console.error(error);
  } finally {
    setSending(false);
  }
};

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Ticket por Correo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Sale info */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Número de venta</p>
                <p className="font-semibold font-mono">{sale.saleNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-semibold">{sale.clientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-semibold">
                  {format(sale.date, "dd MMM yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold text-accent">
                  {formatCurrency(sale.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="ticket-email">
              Correo electrónico <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticket-email"
              type="email"
              placeholder="cliente@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              className={emailError ? "border-destructive" : ""}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Asunto</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="ticket-message">Mensaje</Label>
            <Textarea
              id="ticket-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Attach PDF */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="attach-pdf"
              checked={attachPdf}
              onCheckedChange={(v) => setAttachPdf(v === true)}
            />
            <Label htmlFor="attach-pdf" className="cursor-pointer">
              Adjuntar ticket en PDF
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={sending}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending}
            className="bg-primary hover:bg-primary/90"
          >
            {sending ? (
              <>Enviando...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar ticket
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendTicketModal;
