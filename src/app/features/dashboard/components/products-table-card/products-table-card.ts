import { Component, input, signal } from '@angular/core';
import { ProductRow } from '../../data/dashboard.view-models';

const STATUS_CLASSES: Record<ProductRow['status'], string> = {
  'En stock': 'bg-green-100 text-green-700',
  'Bajo stock': 'bg-red-100 text-red-600',
  Crítico: 'bg-red-100 text-red-700',
};

// Tarjeta de productos bajo mínimo: tabs, filtros y tabla.
@Component({
  selector: 'app-products-table-card',
  templateUrl: './products-table-card.html',
})
export class ProductsTableCard {
  readonly products = input.required<ProductRow[]>();
  protected readonly activeTab = signal<'productos' | 'categorias'>('productos');

  protected statusClass(status: ProductRow['status']): string {
    return STATUS_CLASSES[status];
  }
}
