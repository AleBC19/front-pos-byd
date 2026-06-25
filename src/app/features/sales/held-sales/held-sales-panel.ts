import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { SaleListItemDto, SaleStatus } from '../../../core/models/sale';
import { SalesService } from '../../../core/services/sales-service';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';

// Panel de acceso rápido a ventas en espera (estado Pending) dentro de Nueva Venta.
// Lista GET /api/sales?status=Pending; permite cobrar (reanudar) o descartar cada una.
@Component({
  selector: 'app-held-sales-panel',
  templateUrl: './held-sales-panel.html',
  imports: [SidePanel, CurrencyPipe, DatePipe],
})
export class HeldSalesPanel {
  private readonly salesService = inject(SalesService);

  readonly open = model(false);
  // Token que fuerza recargar la lista (se incrementa al dejar una venta en espera).
  readonly refresh = input(0);

  // El contenedor (NewSale) recibe el id y abre el cobro en modo reanudar.
  readonly charge = output<number>();
  // Se emite tras descartar para que el contenedor actualice el contador.
  readonly changed = output<void>();

  protected readonly held = signal<SaleListItemDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly discardingId = signal<number | null>(null);

  constructor() {
    // Carga la lista al abrir el panel o cuando cambia el token de recarga.
    effect(() => {
      this.refresh();
      if (this.open()) {
        this.load();
      }
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.salesService
      .getSales({ status: SaleStatus.Pending, sortBy: 'date', desc: true, pageSize: 60 })
      .subscribe({
        next: (response) => {
          this.held.set(response.items);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(extractApiError(err).message);
        },
      });
  }

  protected cobrar(sale: SaleListItemDto): void {
    this.charge.emit(sale.id);
    this.open.set(false);
  }

  protected discard(sale: SaleListItemDto): void {
    this.discardingId.set(sale.id);
    this.salesService.discardHeld(sale.id).subscribe({
      next: () => {
        this.discardingId.set(null);
        this.held.update((items) => items.filter((item) => item.id !== sale.id));
        this.changed.emit();
      },
      error: (err) => {
        this.discardingId.set(null);
        this.error.set(extractApiError(err).message);
      },
    });
  }
}
