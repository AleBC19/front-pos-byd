// Datos dummy del dashboard basados en el mockup public/mockups/dashboard-view.png.
// TODO: reemplazar por datos reales del backend cuando exista el API.

export interface KpiCard {
  label: string;
  value: string;
  changePercent: string;
  previousValue: string;
  icon: 'currency' | 'ticket' | 'user' | 'bag';
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export interface SalesByDay {
  labels: string[];
  sales: number[];
  tickets: number[];
  total: string;
}

export interface BreakdownItem {
  label: string;
  percent: string;
  amount: string;
  color: string;
}

export interface StockAlert {
  name: string;
  code: string;
  stock: number;
  severity: 'critical' | 'warning';
}

export interface ProductRow {
  code: string;
  name: string;
  category: string;
  price: string;
  cost: string;
  stock: number;
  status: 'En stock' | 'Bajo stock' | 'Crítico';
}

export interface KardexMovement {
  date: string;
  product: string;
  type: 'Entrada' | 'Salida';
  quantity: string;
  user: string;
}

export const KPI_CARDS: KpiCard[] = [
  {
    label: 'Ventas de hoy',
    value: '$18,450.00',
    changePercent: '12.5%',
    previousValue: '($16,400.00)',
    icon: 'currency',
    color: 'blue',
  },
  {
    label: 'Tickets',
    value: '124',
    changePercent: '8.8%',
    previousValue: '(114)',
    icon: 'ticket',
    color: 'green',
  },
  {
    label: 'Ticket promedio',
    value: '$149.19',
    changePercent: '3.4%',
    previousValue: '($144.28)',
    icon: 'user',
    color: 'purple',
  },
  {
    label: 'Productos vendidos',
    value: '386',
    changePercent: '15.2%',
    previousValue: '(335)',
    icon: 'bag',
    color: 'orange',
  },
];

export const SALES_BY_DAY: SalesByDay = {
  labels: ['17/05', '18/05', '19/05', '20/05', '21/05', '22/05', '23/05'],
  sales: [12500, 8000, 11800, 15200, 17600, 15800, 18450],
  tickets: [95, 70, 88, 105, 120, 110, 124],
  total: '$18,450.00',
};

export const SALES_BY_PAYMENT_METHOD: BreakdownItem[] = [
  { label: 'Efectivo', percent: '45.3%', amount: '$8,360.00', color: '#22c55e' },
  { label: 'Tarjeta', percent: '40.1%', amount: '$7,400.00', color: '#3b82f6' },
  { label: 'Transferencia', percent: '10.8%', amount: '$1,990.00', color: '#8b5cf6' },
  { label: 'Otros', percent: '3.8%', amount: '$700.00', color: '#9ca3af' },
];

export const SALES_BY_CATEGORY: BreakdownItem[] = [
  { label: 'Materiales', percent: '52.6%', amount: '$9,710.00', color: '#3b82f6' },
  { label: 'Instrumental', percent: '23.4%', amount: '$4,320.00', color: '#14b8a6' },
  { label: 'Consumibles', percent: '16.2%', amount: '$2,990.00', color: '#f97316' },
  { label: 'Otros', percent: '7.8%', amount: '$1,430.00', color: '#9ca3af' },
];

export const STOCK_ALERTS: StockAlert[] = [
  { name: 'Guantes Nitrilo Talla M', code: 'GNT-M', stock: 2, severity: 'warning' },
  { name: 'Ácido Fosfórico 37%', code: 'ACF-37', stock: 1, severity: 'critical' },
  { name: 'Resina Filtek Z350 A2', code: 'RES-Z350-A2', stock: 3, severity: 'warning' },
  { name: 'Anestesia Lidocaína 2%', code: 'ANE-LID-2', stock: 4, severity: 'warning' },
  { name: 'Agujas Dentales 27G', code: 'AGU-27G', stock: 6, severity: 'warning' },
];

export const TOTAL_ALERTS = 6;

export const PRODUCT_ROWS: ProductRow[] = [
  {
    code: 'RES-Z350-A2',
    name: 'Resina Filtek Z350 A2',
    category: 'Materiales',
    price: '$1,250.00',
    cost: '$780.00',
    stock: 3,
    status: 'Bajo stock',
  },
  {
    code: 'ACF-37',
    name: 'Ácido Fosfórico 37%',
    category: 'Materiales',
    price: '$185.00',
    cost: '$110.00',
    stock: 1,
    status: 'Crítico',
  },
  {
    code: 'GNT-M',
    name: 'Guantes Nitrilo Talla M',
    category: 'Consumibles',
    price: '$180.00',
    cost: '$95.00',
    stock: 2,
    status: 'Crítico',
  },
  {
    code: 'ANE-LID-2',
    name: 'Anestesia Lidocaína 2%',
    category: 'Materiales',
    price: '$620.00',
    cost: '$410.00',
    stock: 4,
    status: 'Bajo stock',
  },
  {
    code: 'AGU-27G',
    name: 'Agujas Dentales 27G',
    category: 'Consumibles',
    price: '$95.00',
    cost: '$58.00',
    stock: 6,
    status: 'Bajo stock',
  },
  {
    code: 'ALGIN-500',
    name: 'Alginato Cavex 500 g',
    category: 'Materiales',
    price: '$250.00',
    cost: '$130.00',
    stock: 25,
    status: 'En stock',
  },
];

export const INVENTORY_SUMMARY = {
  value: '$287,450.00',
  valueUpdatedAt: 'Actualizado hoy 10:42 AM',
  lowStock: 18,
  outOfStock: 5,
};

export const KARDEX_MOVEMENTS: KardexMovement[] = [
  {
    date: '23/05/2025 10:30',
    product: 'Resina Filtek Z350 A2',
    type: 'Salida',
    quantity: '-2',
    user: 'Administrador',
  },
  {
    date: '23/05/2025 10:15',
    product: 'Guantes Nitrilo Talla M',
    type: 'Salida',
    quantity: '-1',
    user: 'Administrador',
  },
  {
    date: '23/05/2025 09:50',
    product: 'Alginato Cavex 500 g',
    type: 'Entrada',
    quantity: '+5',
    user: 'Administrador',
  },
  {
    date: '23/05/2025 09:30',
    product: 'Ácido Fosfórico 37%',
    type: 'Salida',
    quantity: '-1',
    user: 'Administrador',
  },
  {
    date: '23/05/2025 09:15',
    product: 'Anestesia Lidocaína 2%',
    type: 'Salida',
    quantity: '-2',
    user: 'Administrador',
  },
];

export const CASH_REGISTER = {
  name: 'Caja 1',
  openedAt: '08:00 AM',
  openedBy: 'Administrador',
  expectedCash: '$5,350.00',
  countedCash: '$5,320.00',
  difference: '-$30.00',
};
