import { Component, computed, inject, signal } from '@angular/core';
import { extractApiError } from '../../core/models/api';
import { CategoryDto } from '../../core/models/category';
import {
  BelowMinimumProductDto,
  DashboardOverviewDto,
  DashboardOverviewQuery,
  DashboardPeriod,
} from '../../core/models/dashboard';
import { InventoryMovementDto, InventorySummaryDto } from '../../core/models/inventory';
import { CategoriesService } from '../../core/services/categories-service';
import { DashboardService } from '../../core/services/dashboard-service';
import { InventoryService } from '../../core/services/inventory-service';
import { AlertsPanel } from './components/alerts-panel/alerts-panel';
import { InventorySummary } from './components/inventory-summary/inventory-summary';
import { KardexCard } from './components/kardex-card/kardex-card';
import { ProductsTableCard } from './components/products-table-card/products-table-card';
import { SalesByDayChart } from './components/sales-by-day-chart/sales-by-day-chart';
import { SalesDonutCard } from './components/sales-donut-card/sales-donut-card';
import { StatCard } from './components/stat-card/stat-card';
import {
  BreakdownItem,
  InventorySummaryView,
  KardexMovement,
  KpiCard,
  ProductRow,
  SalesByDay,
  StockAlert,
} from './data/dashboard.view-models';

// Paletas de colores para las donas (se asignan por índice, con gris de relleno).
const PAYMENT_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#9ca3af'];
const CATEGORY_COLORS = ['#3b82f6', '#14b8a6', '#f97316', '#8b5cf6', '#22c55e', '#9ca3af'];

// Botones del selector de período.
const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'custom', label: 'Personalizado' },
];

// Vista principal del dashboard: compone KPIs, gráficas, alertas, productos e
// inventario con datos reales de /api/dashboard/overview y /api/inventory.
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  imports: [
    StatCard,
    SalesByDayChart,
    SalesDonutCard,
    AlertsPanel,
    ProductsTableCard,
    InventorySummary,
    KardexCard,
  ],
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly inventoryService = inject(InventoryService);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly periodOptions = PERIOD_OPTIONS;

  // Estado del selector de período.
  protected readonly period = signal<DashboardPeriod>('today');
  protected readonly fromDate = signal('');
  protected readonly toDate = signal('');

  // Datos crudos del API.
  private readonly overview = signal<DashboardOverviewDto | null>(null);
  private readonly summary = signal<InventorySummaryDto | null>(null);
  private readonly belowMinimum = signal<BelowMinimumProductDto[]>([]);
  private readonly movements = signal<InventoryMovementDto[]>([]);
  private readonly categories = signal<CategoryDto[]>([]);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Mapa categoryId → nombre, para resolver la categoría de below-minimum.
  private readonly categoryNames = computed(() => {
    const map = new Map<number, string>();
    for (const category of this.categories()) {
      map.set(category.id, category.name);
    }
    return map;
  });

  // --- View-models que alimentan a los componentes hijos ---

  protected readonly kpiCards = computed<KpiCard[]>(() => {
    const kpis = this.overview()?.kpis;
    if (!kpis) {
      return [];
    }
    return [
      {
        label: 'Ventas de hoy',
        value: formatMoney(kpis.totalSales),
        changePercent: formatPercent(kpis.salesChangePct),
        previousValue: `(${formatMoney(kpis.previousTotalSales)})`,
        icon: 'currency',
        color: 'blue',
      },
      {
        label: 'Tickets',
        value: String(kpis.ticketCount),
        changePercent: formatPercent(kpis.ticketsChangePct),
        previousValue: `(${kpis.previousTicketCount})`,
        icon: 'ticket',
        color: 'green',
      },
      {
        label: 'Ticket promedio',
        value: formatMoney(kpis.averageTicket),
        changePercent: formatPercent(kpis.averageTicketChangePct),
        previousValue: `(${formatMoney(kpis.previousAverageTicket)})`,
        icon: 'user',
        color: 'purple',
      },
      {
        label: 'Productos vendidos',
        value: String(kpis.productsSold),
        changePercent: formatPercent(kpis.productsSoldChangePct),
        previousValue: `(${kpis.previousProductsSold})`,
        icon: 'bag',
        color: 'orange',
      },
    ];
  });

  protected readonly salesByDay = computed<SalesByDay>(() => {
    const points = this.overview()?.salesByDay ?? [];
    return {
      labels: points.map((point) => formatDayLabel(point.date)),
      sales: points.map((point) => point.total),
      tickets: points.map((point) => point.tickets),
      total: formatMoney(points.reduce((sum, point) => sum + point.total, 0)),
    };
  });

  protected readonly salesByPaymentMethod = computed<BreakdownItem[]>(() =>
    (this.overview()?.salesByPaymentMethod ?? []).map((item, index) => ({
      label: item.method,
      percent: formatPercent(item.percentage, false),
      amount: formatMoney(item.total),
      color: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
    })),
  );

  protected readonly salesByCategory = computed<BreakdownItem[]>(() =>
    (this.overview()?.salesByCategory ?? []).map((item, index) => ({
      label: item.category,
      percent: formatPercent(item.percentage, false),
      amount: formatMoney(item.total),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    })),
  );

  protected readonly stockAlerts = computed<StockAlert[]>(() =>
    this.belowMinimum().map((product) => ({
      name: product.name,
      code: product.code,
      stock: product.stock,
      severity: product.stock === 0 ? 'critical' : 'warning',
    })),
  );

  protected readonly totalAlerts = computed(() => this.belowMinimum().length);

  protected readonly productRows = computed<ProductRow[]>(() => {
    const names = this.categoryNames();
    return this.belowMinimum().map((product) => ({
      code: product.code,
      name: product.name,
      category: names.get(product.categoryId) ?? '—',
      // below-minimum devuelve los precios en centavos.
      price: formatMoney(product.salePrice / 100),
      cost: formatMoney(product.purchasePrice / 100),
      stock: product.stock,
      status: product.stock === 0 ? 'Crítico' : 'Bajo stock',
    }));
  });

  protected readonly inventorySummary = computed<InventorySummaryView>(() => {
    const summary = this.summary();
    if (!summary) {
      return { value: formatMoney(0), valueUpdatedAt: '', lowStock: 0, outOfStock: 0 };
    }
    return {
      value: formatMoney(summary.totalValueCost),
      valueUpdatedAt: `Actualizado ${formatTime(new Date())}`,
      lowStock: summary.lowStockCount,
      outOfStock: summary.outOfStockCount,
    };
  });

  protected readonly kardexMovements = computed<KardexMovement[]>(() =>
    this.movements().map((movement) => ({
      date: formatDateTime(movement.createdAt),
      product: movement.productName,
      type: movement.change >= 0 ? 'Entrada' : 'Salida',
      quantity: movement.change > 0 ? `+${movement.change}` : String(movement.change),
      user: movement.userName ?? '—',
    })),
  );

  constructor() {
    this.loadOverview();
    this.loadInventory();
    this.loadCategories();
  }

  protected onPeriodChange(period: DashboardPeriod): void {
    this.period.set(period);
    if (period !== 'custom') {
      this.fromDate.set('');
      this.toDate.set('');
      this.loadOverview();
    } else if (this.fromDate() && this.toDate()) {
      this.loadOverview();
    }
  }

  protected onFromChange(value: string): void {
    this.fromDate.set(value);
    this.reloadCustom();
  }

  protected onToChange(value: string): void {
    this.toDate.set(value);
    this.reloadCustom();
  }

  private reloadCustom(): void {
    if (this.period() === 'custom' && this.fromDate() && this.toDate()) {
      this.loadOverview();
    }
  }

  private loadOverview(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: DashboardOverviewQuery = { period: this.period() };
    if (this.period() === 'custom') {
      query.from = this.fromDate();
      query.to = this.toDate();
    }

    this.dashboardService.getOverview(query).subscribe({
      next: (overview) => {
        this.overview.set(overview);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  // El inventario no depende del período: se carga una sola vez.
  private loadInventory(): void {
    this.inventoryService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.summary.set(null),
    });
    this.inventoryService.getBelowMinimum().subscribe({
      next: (products) => this.belowMinimum.set(products),
      error: () => this.belowMinimum.set([]),
    });
    this.inventoryService.getMovements({ page: 1, pageSize: 5 }).subscribe({
      next: (response) => this.movements.set(response.items),
      error: () => this.movements.set([]),
    });
  }

  private loadCategories(): void {
    this.categoriesService.getCategories({ pageSize: 50, includeInactive: true }).subscribe({
      next: (response) => this.categories.set(response.items),
      error: () => this.categories.set([]),
    });
  }
}

// --- Helpers de formato ---

function formatMoney(value: number): string {
  return (
    '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

// Porcentaje con un decimal. Con signo (cambios) o sin él (rubros de dona).
function formatPercent(value: number, withSign = true): string {
  const sign = withSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// 'YYYY-MM-DD' → 'dd/MM' sin pasar por Date (evita desfases de zona horaria).
function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString('es-MX')} ${formatTime(date)}`;
}
