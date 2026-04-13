import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Download, 
  ClipboardList, 
  DollarSign,
  Package,
  Calendar,
  TrendingUp,
  Printer,
  Loader2
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ReportsPage = () => {
  const { authFetch } = useAuth();
  const [dateRange, setDateRange] = useState("thisMonth");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const COLORS_MAP: Record<string, string> = {
    "1": 'hsl(45, 93%, 47%)',  // Pendiente
    "2": 'hsl(210, 100%, 50%)', // En Proceso
    "3": 'hsl(142, 76%, 36%)',  // Terminado
    "4": 'hsl(215, 15%, 60%)',  // Entregado
  };

  const statusNames: Record<string, string> = {
    "1": 'Pendiente',
    "2": 'En Proceso',
    "3": 'Terminado',
    "4": 'Entregado',
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`http://localhost:4000/api/reportes/dashboard?range=${dateRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error("Error al cargar los datos del servidor");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  // FUNCIÓN PARA DESCARGAR PDF
  const handleGeneratePDF = async (reportTitle: string) => {
    const reportMap: Record<string, string> = {
      'Reporte de Pedidos': 'pedidos',
      'Reporte de Ventas': 'ventas',
      'Reporte de Inventario': 'inventario'
    };

    const endpoint = reportMap[reportTitle];
    if (!endpoint) {
      toast.error("Este reporte aún no está configurado");
      return;
    }

    try {
      toast.info(`Generando ${reportTitle}...`);
      const response = await authFetch(`http://localhost:4000/api/reportes/pdf/${endpoint}?range=${dateRange}`);
      if (!response.ok) throw new Error("Error al generar el documento");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fechaHoy = new Date().toISOString().split('T')[0];

      const link = document.body.appendChild(document.createElement('a'));
      link.href = url;
      link.download = `${endpoint}-${dateRange}-${fechaHoy}.pdf`;
      link.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
      }, 100);

      toast.success("Descarga completada");
    } catch (error: any) {
      toast.error(error.message || "Error de servidor");
    }
  };

  // FUNCIÓN PARA IMPRIMIR (Corregido para tamaño carta y auto-cierre)
  const handlePrintPDF = async (reportTitle: string) => {
    const reportMap: Record<string, string> = {
      'Reporte de Pedidos': 'pedidos',
      'Reporte de Ventas': 'ventas',
      'Reporte de Inventario': 'inventario'
    };

    const endpoint = reportMap[reportTitle];
    if (!endpoint) return;

    try {
      toast.info("Preparando visor de impresión...");
      const response = await authFetch(`http://localhost:4000/api/reportes/pdf/${endpoint}?range=${dateRange}`);
      if (!response.ok) throw new Error("Error al generar documento");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          // Inyectamos CSS para asegurar que el navegador entienda que es tamaño carta y sin márgenes extra
          const style = printWindow.document.createElement('style');
          style.innerHTML = `
            @page { size: letter; margin: 0; }
            body { margin: 0; }
          `;
          printWindow.document.head.appendChild(style);

          // Pequeño delay para que el estilo se aplique antes de abrir el diálogo
          setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => {
              printWindow.close();
              window.URL.revokeObjectURL(url);
            };
          }, 500);
        };
        toast.success("Visor abierto");
      } else {
        toast.error("El navegador bloqueó la ventana emergente. Por favor, permítelas para imprimir.");
      }
    } catch (error) {
      toast.error("No se pudo conectar con la impresora");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const ordersByStatusData = useMemo(() => {
    if (!data?.charts.pedidosEstado) return [];
    return data.charts.pedidosEstado.map((item: any) => ({
      name: statusNames[item.estado] || 'Otro',
      value: parseInt(item.cantidad),
      color: COLORS_MAP[item.estado] || '#ccc'
    }));
  }, [data]);

  const reportTypes = [
    {
      id: 'orders',
      title: 'Reporte de Pedidos',
      description: 'Listado completo de pedidos con estado, cliente y fechas',
      icon: ClipboardList,
    },
    {
      id: 'sales',
      title: 'Reporte de Ventas',
      description: 'Resumen de ventas, ingresos y estadísticas',
      icon: DollarSign,
    },
    {
      id: 'inventory',
      title: 'Reporte de Inventario',
      description: 'Stock actual, productos por reabastecer y movimientos',
      icon: Package,
    },
  ];

  if (loading && !data) {
    return (
      <AppLayout title="Reportes">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Reportes">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground">Genera y descarga reportes de tu negocio</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="thisWeek">Esta semana</SelectItem>
              <SelectItem value="thisMonth">Este mes</SelectItem>
              <SelectItem value="thisYear">Este año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.stats.ingresosTotales)}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 text-green-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pedidos Totales</p>
                  <p className="text-2xl font-bold">{data?.stats.pedidosTotales}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <ClipboardList className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.stats.ticketPromedio)}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <p className="text-2xl font-bold text-destructive">{data?.stats.stockBajo}</p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Ventas por Semana</CardTitle>
              <CardDescription>Ingresos de las últimas 4 semanas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data?.charts.ventasSemana}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  />
                  <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Pedidos por Estado</CardTitle>
              <CardDescription>Distribución actual de pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ordersByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {ordersByStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Report Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Generar Reportes PDF</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report, index) => (
              <Card 
                key={report.id} 
                className="hover:shadow-md transition-all animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGeneratePDF(report.title)}
                    >
                      <Download className="h-4 w-4 mr-2" /> Descargar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePrintPDF(report.title)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;