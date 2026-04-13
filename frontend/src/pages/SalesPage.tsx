import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ClipboardList } from "lucide-react";
import SalesTab from "@/components/sales/SalesTab";
import OrdersTab from "@/components/sales/OrdersTab";
import { Sale } from "@/types/order";

const SalesPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "orders" ? "orders" : "sales";
  const [convertedSales, setConvertedSales] = useState<Sale[]>([]);

  const handleOrderConverted = useCallback((sale: Sale) => {
    setConvertedSales((prev) => [sale, ...prev]);
  }, []);

  return (
    <AppLayout title="Ventas y Pedidos">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ventas y Pedidos</h1>
          <p className="text-muted-foreground">
            Gestiona ventas directas y pedidos personalizados
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="sales" className="gap-2 data-[state=active]:bg-[hsl(var(--status-finished))] data-[state=active]:text-[hsl(var(--status-finished-foreground))]">
              <ShoppingCart className="h-4 w-4" />
              Ver Ventas
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-[hsl(var(--status-in-progress))] data-[state=active]:text-white">
              <ClipboardList className="h-4 w-4" />
              Ver Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <SalesTab extraSales={convertedSales} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab onOrderConverted={handleOrderConverted} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SalesPage;