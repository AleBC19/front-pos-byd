// Modelos de presentación del dashboard. El componente padre mapea las respuestas
// del API a estas formas y las pasa a los componentes hijos por input().

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

export interface InventorySummaryView {
  value: string;
  valueUpdatedAt: string;
  lowStock: number;
  outOfStock: number;
}
