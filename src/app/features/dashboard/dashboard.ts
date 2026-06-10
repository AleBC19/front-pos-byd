import { Component } from '@angular/core';
import { AlertsPanel } from './components/alerts-panel/alerts-panel';
import { InventorySummary } from './components/inventory-summary/inventory-summary';
import { KardexCard } from './components/kardex-card/kardex-card';
import { ProductsTableCard } from './components/products-table-card/products-table-card';
import { SalesByDayChart } from './components/sales-by-day-chart/sales-by-day-chart';
import { SalesDonutCard } from './components/sales-donut-card/sales-donut-card';
import { StatCard } from './components/stat-card/stat-card';
import {
  KPI_CARDS,
  SALES_BY_CATEGORY,
  SALES_BY_PAYMENT_METHOD,
} from './data/dashboard-mock';

// Vista principal del dashboard: compone KPIs, gráficas, alertas,
// productos e inventario con datos dummy.
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
  protected readonly kpiCards = KPI_CARDS;
  protected readonly salesByPaymentMethod = SALES_BY_PAYMENT_METHOD;
  protected readonly salesByCategory = SALES_BY_CATEGORY;
}
