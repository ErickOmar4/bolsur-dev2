import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, AlertTriangle, Package, CheckCircle2, PlusCircle, Loader2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, subDays, isAfter } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  type: "overdue" | "low_stock" | "delivered" | "new_order";
  title: string;
  description: string;
  created_at: string;
  read: boolean;
}

const iconConfig: Record<Notification["type"], { icon: any; className: string }> = {
  overdue:   { icon: AlertTriangle, className: "text-destructive bg-destructive/10" },
  low_stock: { icon: Package,       className: "text-amber-500 bg-amber-500/10" },
  delivered: { icon: CheckCircle2,  className: "text-emerald-500 bg-emerald-500/10" },
  new_order: { icon: PlusCircle,    className: "text-primary bg-primary/10" },
};

const routeConfig: Record<Notification["type"], string> = {
  overdue:   "/orders?filtro=vencidas",
  low_stock: "/inventory",
  delivered: "/orders?filtro=entregadas",
  new_order: "/orders",
};

// Ordena: no leídas primero (por fecha desc), luego leídas (por fecha desc)
function sortNotifications(list: Notification[]): Notification[] {
  const unread = list
    .filter((n) => !n.read)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const read = list
    .filter((n) => n.read)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return [...unread, ...read];
}

// Solo notificaciones de los últimos 7 días
function filterByWeek(list: Notification[]): Notification[] {
  const cutoff = subDays(new Date(), 7);
  return list.filter((n) => isAfter(new Date(n.created_at), cutoff));
}

// ─── Ítem reutilizable ────────────────────────────────────────────────────────
function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: (n: Notification) => void;
}) {
  const config = iconConfig[notification.type] ?? iconConfig.new_order;
  const Icon = config.icon;

  return (
    <div
      onClick={() => onClick(notification)}
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", config.className)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm",
            !notification.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
          )}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
        </p>
      </div>
    </div>
  );
}

// ─── Panel flotante "Todas las notificaciones" ────────────────────────────────
function AllNotificationsPanel({
  notifications,
  onClose,
  onNotificationClick,
  onMarkAllRead,
  unreadCount,
}: {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (n: Notification) => void;
  onMarkAllRead: () => void;
  unreadCount: number;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] max-w-[95vw] max-h-[80vh] bg-background border rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Todas las notificaciones</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {unreadCount} sin leer
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Marcar todas
              </button>
            )}
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={(notif) => { onNotificationClick(notif); onClose(); }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No hay notificaciones recientes</p>
              <p className="text-xs opacity-60">Solo se muestran los últimos 7 días</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function NotificationsDropdown() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showAllPanel, setShowAllPanel] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await authFetch("http://localhost:4000/api/notificaciones");
      if (response.ok) {
        const data: Notification[] = await response.json();
        // Filtrar últimos 7 días y ordenar: no leídas primero
        const filtered = sortNotifications(filterByWeek(data));
        setNotifications(filtered);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 900_000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markOneRead = async (id: string) => {
    try {
      await authFetch(`http://localhost:4000/api/notificaciones/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        sortNotifications(prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      );
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await authFetch(
        "http://localhost:4000/api/notificaciones/read-all",
        { method: "PUT" }
      );
      if (response.ok) {
        setNotifications((prev) =>
          sortNotifications(prev.map((n) => ({ ...n, read: true })))
        );
      }
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) await markOneRead(notification.id);
    setOpen(false);
    navigate(routeConfig[notification.type] ?? "/");
  };

  const previewNotifications = notifications.slice(0, 5);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        {/*
          FIX removeChild crash:
          NO usar asChild ni anidar Button dentro de span aquí.
          PopoverTrigger debe envolver directamente el botón sin portales extra.
          El badge se posiciona con un div wrapper FUERA del PopoverTrigger.
        */}
        <div className="relative inline-flex">
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5 text-accent" />
            </Button>
          </PopoverTrigger>
          {unreadCount > 0 && (
            <span
              className="pointer-events-none absolute -top-1 -right-1 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background"
              aria-label={`${unreadCount} notificaciones sin leer`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">Notificaciones</h4>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista (máx 5 en dropdown) */}
          <ScrollArea className="max-h-[360px]">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewNotifications.length > 0 ? (
              <div className="divide-y">
                {previewNotifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay notificaciones recientes
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); setShowAllPanel(true); }}
              className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Ver todas las notificaciones
              {notifications.length > 5 && (
                <span className="ml-1 text-muted-foreground">({notifications.length})</span>
              )}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Panel flotante — renderizado fuera del Popover para evitar conflictos de portal */}
      {showAllPanel && (
        <AllNotificationsPanel
          notifications={notifications}
          onClose={() => setShowAllPanel(false)}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={markAllRead}
          unreadCount={unreadCount}
        />
      )}
    </>
  );
}