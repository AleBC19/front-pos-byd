import { Component, signal } from '@angular/core';
import { PRODUCT_ROWS, ProductRow } from '../../data/dashboard-mock';

const STATUS_CLASSES: Record<ProductRow['status'], string> = {
  'En stock': 'bg-green-100 text-green-700',
  'Bajo stock': 'bg-red-100 text-red-600',
  Crítico: 'bg-red-100 text-red-700',
};

// Tarjeta de productos: tabs, filtros, tabla y paginación (datos dummy,
// sin lógica de filtrado/paginación todavía).
@Component({
  selector: 'app-products-table-card',
  templateUrl: './products-table-card.html',
})
export class ProductsTableCard {
  protected readonly products = PRODUCT_ROWS;
  protected readonly activeTab = signal<'productos' | 'categorias'>('productos');

  protected statusClass(status: ProductRow['status']): string {
    return STATUS_CLASSES[status];
  }
}
