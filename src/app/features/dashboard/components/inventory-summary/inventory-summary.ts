import { Component, input } from '@angular/core';
import { InventorySummaryView } from '../../data/dashboard.view-models';

// Resumen de inventario: valor total, bajo stock y agotados.
@Component({
  selector: 'app-inventory-summary',
  templateUrl: './inventory-summary.html',
})
export class InventorySummary {
  readonly summary = input.required<InventorySummaryView>();
}
