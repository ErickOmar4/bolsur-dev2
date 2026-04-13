import { Order, Product, Sale, DashboardStats } from '@/types/order';

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'PED-2024-001',
    clientName: 'Comercial El Faro',
    clientEmail: 'contacto@elfaro.com',
    clientPhone: '+52 55 1234 5678',
    items: [
      {
        id: '1a',
        productName: 'Bolsas Kraft 30x40',
        quantity: 500,
        unitPrice: 2.50,
        service: 'serigrafia',
        color: 'Rojo',
        specifications: { width: 30, height: 40, notes: 'Logo a 2 tintas' }
      }
    ],
    status: 'pending',
    totalAmount: 1250,
    createdAt: new Date('2024-01-15'),
    deliveryDate: new Date('2024-01-20'),
    notes: 'Cliente frecuente, prioridad alta',
    createdBy: 'María González'
  },
  {
    id: '2',
    orderNumber: 'PED-2024-002',
    clientName: 'Restaurante La Casona',
    clientPhone: '+52 55 9876 5432',
    items: [
      {
        id: '2a',
        productName: 'Bolsas Papel Blanco 20x30',
        quantity: 1000,
        unitPrice: 1.80,
        service: 'sublimacion',
        specifications: { width: 20, height: 30 }
      }
    ],
    status: 'in-progress',
    totalAmount: 1800,
    createdAt: new Date('2024-01-14'),
    deliveryDate: new Date('2024-01-18'),
    createdBy: 'Carlos Ruiz',
    assignedTo: 'Pedro Hernández'
  },
  {
    id: '3',
    orderNumber: 'PED-2024-003',
    clientName: 'Boutique Elegance',
    clientEmail: 'ventas@elegance.mx',
    clientPhone: '+52 55 5555 1234',
    items: [
      {
        id: '3a',
        productName: 'Bolsas Premium Laminadas',
        quantity: 300,
        unitPrice: 8.50,
        service: 'dtf',
        specifications: { width: 25, height: 35, notes: 'Acabado mate, hot stamping dorado' }
      }
    ],
    status: 'finished',
    totalAmount: 2550,
    createdAt: new Date('2024-01-12'),
    deliveryDate: new Date('2024-01-17'),
    createdBy: 'María González',
    assignedTo: 'Ana López'
  },
  {
    id: '4',
    orderNumber: 'PED-2024-004',
    clientName: 'Panadería Don José',
    clientPhone: '+52 55 4444 3333',
    items: [
      {
        id: '4a',
        productName: 'Bolsas para Pan',
        quantity: 2000,
        unitPrice: 0.80,
        service: 'serigrafia',
        specifications: { notes: 'Impresión sencilla 1 tinta' }
      }
    ],
    status: 'delivered',
    totalAmount: 1600,
    createdAt: new Date('2024-01-10'),
    deliveryDate: new Date('2024-01-15'),
    deliveredAt: new Date('2024-01-15'),
    createdBy: 'Carlos Ruiz'
  },
  {
    id: '5',
    orderNumber: 'PED-2024-005',
    clientName: 'Farmacia San Juan',
    clientEmail: 'compras@farmaciasanjuan.com',
    clientPhone: '+52 55 2222 1111',
    items: [
      {
        id: '5a',
        productName: 'Bolsas Pequeñas 15x20',
        quantity: 5000,
        unitPrice: 0.50,
        service: 'sublimacion',
        specifications: { width: 15, height: 20 }
      }
    ],
    status: 'pending',
    totalAmount: 2500,
    createdAt: new Date('2024-01-16'),
    deliveryDate: new Date('2024-01-19'),
    notes: 'Entrega urgente',
    createdBy: 'María González'
  },
  {
    id: '6',
    orderNumber: 'PED-2024-006',
    clientName: 'Tienda Deportiva Max',
    clientPhone: '+52 55 7777 8888',
    items: [
      {
        id: '6a',
        productName: 'Bolsas Grandes 50x60',
        quantity: 400,
        unitPrice: 6.00,
        service: 'dtf',
        specifications: { width: 50, height: 60, notes: 'Full color, diseño especial' }
      }
    ],
    status: 'in-progress',
    totalAmount: 2400,
    createdAt: new Date('2024-01-13'),
    deliveryDate: new Date('2024-01-21'),
    createdBy: 'Carlos Ruiz',
    assignedTo: 'Pedro Hernández'
  }
];

export const mockSales: Sale[] = [
  {
    id: 's1',
    saleNumber: 'VTA-2024-001',
    clientName: 'Papelería Central',
    date: new Date('2024-01-15'),
    items: [
      { id: 'si1', productId: 'p1', productName: 'Bolsas Kraft 30x40', quantity: 100, unitPrice: 2.50, height: 40, width: 30 },
    ],
    totalAmount: 250,
    createdBy: 'María González',
  },
  {
    id: 's2',
    saleNumber: 'VTA-2024-002',
    clientName: 'Tienda La Esquina',
    date: new Date('2024-01-16'),
    items: [
      { id: 'si2', productId: 'p3', productName: 'Cajas para Llevar', quantity: 50, unitPrice: 5.00 },
      { id: 'si3', productId: 'p5', productName: 'Bolsas para Pan', quantity: 200, unitPrice: 0.80 },
    ],
    totalAmount: 410,
    createdBy: 'Carlos Ruiz',
  },
  {
    id: 's3',
    saleNumber: 'VTA-2024-003',
    clientName: 'Restaurante La Casona',
    date: new Date('2024-01-17'),
    items: [
      { id: 'si4', productId: 'p2', productName: 'Bolsas Papel Blanco 20x30', quantity: 300, unitPrice: 1.80 },
    ],
    totalAmount: 540,
    createdBy: 'María González',
    convertedFromOrder: 'PED-2024-002',
  },
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Bolsas Kraft 30x40',
    sku: 'BK-3040',
    category: 'Bolsas Kraft',
    stock: 2500,
    minStock: 500,
    unitPrice: 2.50,
    dimensions: { width: 30, height: 40, unit: 'cm' },
    description: 'Bolsa kraft natural resistente'
  },
  {
    id: 'p2',
    name: 'Bolsas Papel Blanco 20x30',
    sku: 'BPB-2030',
    category: 'Bolsas Papel',
    stock: 3200,
    minStock: 800,
    unitPrice: 1.80,
    dimensions: { width: 20, height: 30, unit: 'cm' }
  },
  {
    id: 'p3',
    name: 'Cajas para Llevar',
    sku: 'CLL-001',
    category: 'Cajas',
    stock: 450,
    minStock: 200,
    unitPrice: 5.00,
    dimensions: { width: 25, height: 15, unit: 'cm' }
  },
  {
    id: 'p4',
    name: 'Bolsas Premium Laminadas',
    sku: 'BPL-2535',
    category: 'Bolsas Premium',
    stock: 180,
    minStock: 100,
    unitPrice: 8.50,
    dimensions: { width: 25, height: 35, unit: 'cm' },
    description: 'Bolsa premium con acabado laminado'
  },
  {
    id: 'p5',
    name: 'Bolsas para Pan',
    sku: 'BP-001',
    category: 'Bolsas Papel',
    stock: 8000,
    minStock: 2000,
    unitPrice: 0.80,
    dimensions: { width: 12, height: 25, unit: 'cm' }
  },
  {
    id: 'p6',
    name: 'Bolsas Pequeñas 15x20',
    sku: 'BPQ-1520',
    category: 'Bolsas Papel',
    stock: 150,
    minStock: 1000,
    unitPrice: 0.50,
    dimensions: { width: 15, height: 20, unit: 'cm' }
  },
  {
    id: 'p7',
    name: 'Bolsas Grandes 50x60',
    sku: 'BG-5060',
    category: 'Bolsas Kraft',
    stock: 600,
    minStock: 300,
    unitPrice: 6.00,
    dimensions: { width: 50, height: 60, unit: 'cm' }
  },
  {
    id: 'p8',
    name: 'Papel Transfer A4',
    sku: 'PT-A4',
    category: 'Materiales',
    stock: 45,
    minStock: 50,
    unitPrice: 15.00,
    dimensions: { width: 21, height: 29.7, unit: 'cm' }
  }
];

export const getDashboardStats = (): DashboardStats => {
  const today = new Date();
  const urgentDate = new Date();
  urgentDate.setDate(today.getDate() + 2);

  return {
    totalOrders: mockOrders.length,
    pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
    inProgressOrders: mockOrders.filter(o => o.status === 'in-progress').length,
    finishedOrders: mockOrders.filter(o => o.status === 'finished').length,
    deliveredToday: mockOrders.filter(o => 
      o.status === 'delivered' && 
      o.deliveredAt?.toDateString() === today.toDateString()
    ).length,
    totalRevenue: mockSales.reduce((sum, s) => sum + s.totalAmount, 0),
    lowStockProducts: mockProducts.filter(p => p.stock <= p.minStock).length,
    urgentDeliveries: mockOrders.filter(o => 
      o.status !== 'delivered' && 
      o.deliveryDate <= urgentDate
    ).length
  };
};
