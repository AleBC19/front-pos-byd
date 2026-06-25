import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { ReturnDto } from '../../../core/models/return';
import { SaleListItemDto } from '../../../core/models/sale';
import { ReturnsService } from '../../../core/services/returns-service';
import { SalesService } from '../../../core/services/sales-service';

// Historial de devoluciones. El backend lista devoluciones por venta (?saleId=), por lo que
// la pantalla busca una venta por folio y muestra las devoluciones asociadas. (Un listado
// global de devoluciones requeriría ampliar el backend.)
@Component({
  selector: 'app-returns-history',
  templateUrl: './returns-history.html',
  imports: [CurrencyPipe, DatePipe],
})
export class ReturnsHistory {
  private readonly salesService = inject(SalesService);
  private readonly returnsService = inject(ReturnsService);

  protected readonly folio = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searched = signal(false);

  protected readonly sale = signal<SaleListItemDto | null>(null);
  protected readonly returns = signal<ReturnDto[]>([]);

  protected onFolio(value: string): void {
    this.folio.set(value);
  }

  // Busca la venta por folio y, si existe, sus devoluciones.
  protected search(): void {
    const folio = this.folio().trim();
    if (!folio) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.searched.set(true);
    this.sale.set(null);
    this.returns.set([]);

    this.salesService.getSales({ folio, pageSize: 20 }).subscribe({
      next: (response) => {
        const match = response.items[0] ?? null;
        if (!match) {
          this.loading.set(false);
          this.error.set('No se encontró ninguna venta con ese folio.');
          return;
        }
        this.sale.set(match);
        this.loadReturns(match.id);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  private loadReturns(saleId: number): void {
    this.returnsService.listBySale(saleId).subscribe({
      next: (returns) => {
        this.returns.set(returns);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }
}
