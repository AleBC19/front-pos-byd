import { Component } from '@angular/core';
import { INVENTORY_SUMMARY } from '../../data/dashboard-mock';

// Resumen de inventario: valor total, bajo stock y agotados.
@Component({
  selector: 'app-inventory-summary',
  templateUrl: './inventory-summary.html',
})
export class InventorySummary {
  protected readonly summary = INVENTORY_SUMMARY;
}
