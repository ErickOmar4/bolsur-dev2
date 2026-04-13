export type OrderStatus = 'pending' | 'in-progress' | 'finished' | 'delivered';

export type ServiceType = 'serigrafia' | 'sublimacion' | 'dtf';

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  service: ServiceType;
  color?: string;
  specifications?: {
    width?: number;
    height?: number;
    notes?: string;
  };
}

export interface Order {
  id: string;
  productId: number; // <--- AGREGA ESTA LÍNEA
  orderNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  deliveryDate: Date;
  deliveredAt?: Date;
  descripcion?: string;
  createdBy: string;
  assignedTo?: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  clientName: string;
  date: Date;
  items: SaleItem[];
  totalAmount: number;
  createdBy: string;
  convertedFromOrder?: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  color?: string;
  height?: number;
  width?: number;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  dimensions?: {
    width: number;
    height: number;
    unit: 'cm' | 'in' | 'mm';
  };
  description?: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  finishedOrders: number;
  deliveredToday: number;
  totalRevenue: number;
  lowStockProducts: number;
  urgentDeliveries: number;
}
