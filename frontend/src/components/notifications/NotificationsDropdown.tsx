import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ajusta si usas otro router
import { Bell, AlertTriangle, Package, CheckCircle2, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
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

// FIX 1: mapa de rutas por tipo de notificación
const routeConfig: Record<Notification["type"], string> = {
  overdue:   "/orders?filtro=vencidas",
  low_stock: "/inventory?filtro=bajo-stock",
  delivered: "/orders?filtro=entregadas",
  new_order: "/orders",
};

export function NotificationsDropdown() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await authFetch("http://localhost:4000/api/notificaciones");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // FIX 2: marcar una sola notificación como leída
  const markOneRead = async (id: string) => {
    try {
      await authFetch(`http://localhost:4000/api/notificaciones/${id}/read`, {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
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
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  // FIX 3: navegar al hacer click y marcar como leída si corresponde
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markOneRead(notification.id);
    }
    setOpen(false);
    const route = routeConfig[notification.type] ?? "/";
    navigate(route);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* FIX 4: overflow-visible para que el badge no quede recortado */}
        <Button variant="ghost" size="icon" className="relative overflow-visible">
          <Bell className="h-5 w-5 text-accent" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 z-10 flex items-center justify-center bg-destructive text-white text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Notificaciones</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {unreadCount}
              </Badge>
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

        {/* List */}
        <ScrollArea className="max-h-[360px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = iconConfig[notification.type] || iconConfig.new_order;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        config.className
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.read
                              ? "font-semibold text-foreground"
                              : "font-medium text-muted-foreground"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No tienes notificaciones
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2.5">
          <button
            onClick={() => {
              setOpen(false);
              navigate("/intentary");
            }}
            className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Ver todas las notificaciones
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}