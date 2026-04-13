import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { UrgentAlerts } from "@/components/dashboard/UrgentAlerts";
import { mockOrders, mockProducts } from "@/data/mockData";
import { 
  ClipboardList, Clock, Loader2, CheckCircle2, 
  DollarSign, AlertTriangle, Package, TrendingUp, Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; 

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('http://localhost:4000/api/dashboard/stats'),
          fetch('http://localhost:4000/api/dashboard/recent-orders')
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (ordersRes.ok) setRecentOrders(await ordersRes.json());

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading || !stats) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando datos de Bolsur...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ¡Hola, {user?.nombre_completo?.split(' ')[0] || 'de vuelta'}!
            </h1>
            <p className="text-muted-foreground">Resumen de actividad en Bolsur</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate('/orders/new')}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Pedido
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card rounded-xl border shadow-sm p-5 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-3xl font-bold text-primary">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[hsl(var(--status-pending))]" />
                  <span className="text-lg font-semibold">{stats.pendingOrders}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Pendientes</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 text-[hsl(var(--status-in-progress))]" />
                  <span className="text-lg font-semibold">{stats.inProgressOrders}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Proceso</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--status-finished))]" />
                  <span className="text-lg font-semibold">{stats.finishedOrders}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Hechos</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-5 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Pedidos entregados</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-5 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Alertas</p>
                <p className="text-3xl font-bold text-primary">{stats.activeAlerts}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-semibold">{stats.activeAlerts}</span>
                <span className="text-[10px] text-muted-foreground">Avisos</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-semibold">{stats.lowStockCount}</span>
                <span className="text-[10px] text-muted-foreground">Stock bajo</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-5 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crecimiento</p>
                <p className="text-3xl font-bold text-accent">+12%</p>
                <p className="text-xs text-muted-foreground">vs mes anterior</p>
              </div>
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Si recentOrders da problemas, el componente ya no romperá la web */}
            <RecentOrders orders={recentOrders} />
          </div>
          <div>
            <UrgentAlerts orders={mockOrders} products={mockProducts} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;