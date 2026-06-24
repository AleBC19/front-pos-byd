import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import {
  InventoryMovementDto,
  INVENTORY_PAGE_SIZES,
  MOVEMENT_TYPE_LABELS,
} from '../../../core/models/inventory';
import { InventoryService } from '../../../core/services/inventory-service';

// Historial de movimientos (kardex) contra /api/inventory/movements.
// La columna "Stock resultante" del mockup se reemplaza por "Cantidad"
// (el cambio con signo): el API no expone el stock resultante por movimiento.
@Component({
  selector: 'app-kardex',
  templateUrl: './kardex.html',
  imports: [DatePipe],
})
export class Kardex {
  private readonly inventoryService = inject(InventoryService);

  // El padre incrementa este token para forzar la recarga tras guardar un movimiento.
  readonly refresh = input(0);

  protected readonly typeLabels = MOVEMENT_TYPE_LABELS;

  protected readonly movements = signal<InventoryMovementDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = INVENTORY_PAGE_SIZES[0];

  protected readonly rangeStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize, this.totalCount()),
  );

  constructor() {
    // Carga inicial y recarga cuando cambia el token `refresh`.
    effect(() => {
      this.refresh();
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.inventoryService.getMovements({ page: this.page(), pageSize: this.pageSize }).subscribe({
      next: (response) => {
        this.movements.set(response.items);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }
    this.page.set(page);
    this.load();
  }
}
