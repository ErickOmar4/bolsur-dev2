import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { mockOrders } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OrderStatus } from "@/types/order";

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [costFilter, setCostFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");

  const filteredOrders = useMemo(() => {
    let filtered = [...mockOrders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.clientName.toLowerCase().includes(query) ||
        order.clientPhone.includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Cost filter
    if (costFilter !== "all") {
      switch (costFilter) {
        case "low":
          filtered = filtered.filter(order => order.totalAmount < 1000);
          break;
        case "medium":
          filtered = filtered.filter(order => order.totalAmount >= 1000 && order.totalAmount < 3000);
          break;
        case "high":
          filtered = filtered.filter(order => order.totalAmount >= 3000);
          break;
      }
    }

    // Delivery date filter
    const today = new Date();
    if (deliveryFilter !== "all") {
      switch (deliveryFilter) {
        case "urgent":
          filtered = filtered.filter(order => {
            if (order.status === 'delivered') return false;
            const daysUntil = Math.ceil((order.deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 2;
          });
          break;
        case "thisWeek":
          filtered = filtered.filter(order => {
            const daysUntil = Math.ceil((order.deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 7 && daysUntil > 0;
          });
          break;
        case "overdue":
          filtered = filtered.filter(order => {
            if (order.status === 'delivered') return false;
            return order.deliveryDate < today;
          });
          break;
      }
    }

    // Sort by delivery date (closest first)
    filtered.sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());

    return filtered;
  }, [searchQuery, statusFilter, costFilter, deliveryFilter]);

  const hasActiveFilters = statusFilter !== "all" || costFilter !== "all" || deliveryFilter !== "all" || searchQuery;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCostFilter("all");
    setDeliveryFilter("all");
  };

  return (
    <AppLayout title="Gestión de Pedidos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-muted-foreground">{filteredOrders.length} pedidos encontrados</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate('/orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por número, cliente, teléfono..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in-progress">En Proceso</SelectItem>
                  <SelectItem value="finished">Terminado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Plazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los plazos</SelectItem>
                  <SelectItem value="urgent">Urgente (48h)</SelectItem>
                  <SelectItem value="thisWeek">Esta semana</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={costFilter} onValueChange={setCostFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Costo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los costos</SelectItem>
                  <SelectItem value="low">&lt; $1,000</SelectItem>
                  <SelectItem value="medium">$1,000 - $3,000</SelectItem>
                  <SelectItem value="high">&gt; $3,000</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length > 0 ? (
          <OrdersTable orders={filteredOrders} />
        ) : (
          <div className="bg-card rounded-xl border shadow-sm p-12 text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron pedidos</h3>
            <p className="text-muted-foreground mb-4">Intenta ajustar los filtros de búsqueda</p>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default OrdersPage;
