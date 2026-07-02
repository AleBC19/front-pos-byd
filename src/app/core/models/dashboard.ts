// Contratos del dashboard del API (/api/dashboard).
// Los montos viajan como decimales en pesos. Requiere el permiso ver_reportes.

// Período del resumen. En "custom" se usan from/to (formato YYYY-MM-DD).
export type DashboardPeriod = 'today' | 'week' | 'month' | 'custom';

// Filtros de GET /api/dashboard/overview.
export interface DashboardOverviewQuery {
  period?: DashboardPeriod;
  from?: string;
  to?: string;
}

// KPIs con su comparativa contra el período anterior.
export interface DashboardKpisDto {
  totalSales: number;
  previousTotalSales: number;
  salesChangePct: number;
  ticketCount: number;
  previousTicketCount: number;
  ticketsChangePct: number;
  averageTicket: number;
  previousAverageTicket: number;
  averageTicketChangePct: number;
  productsSold: number;
  previousProductsSold: number;
  productsSoldChangePct: number;
}

// Punto de la gráfica de ventas por día.
export interface SalesByDayPointDto {
  date: string;
  total: number;
  tickets: number;
}

// Rubro de ventas por método de pago.
export interface SalesByPaymentMethodDto {
  method: string;
  total: number;
  percentage: number;
}

// Rubro de ventas por categoría.
export interface SalesByCategoryDto {
  categoryId: number;
  category: string;
  total: number;
  percentage: number;
}

// Respuesta de GET /api/dashboard/overview.
export interface DashboardOverviewDto {
  kpis: DashboardKpisDto;
  salesByDay: SalesByDayPointDto[];
  salesByPaymentMethod: SalesByPaymentMethodDto[];
  salesByCategory: SalesByCategoryDto[];
}

// Respuesta de GET /api/inventory/below-minimum.
// OJO: devuelve la entidad cruda, no un DTO:
//   - salePrice y purchasePrice vienen en CENTAVOS (enteros) → dividir entre 100.
//   - no incluye el nombre de la categoría (solo categoryId).
//   - no trae estado de stock calculado (derivarlo de stock vs minimumStock).
export interface BelowMinimumProductDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  minimumStock: number;
  isActive: boolean;
  categoryId: number;
}
