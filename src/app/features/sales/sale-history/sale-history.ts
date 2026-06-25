import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { extractApiError } from '../../../core/models/api';
import {
  SALE_PAGE_SIZES,
  SALE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  SaleListItemDto,
  SaleStatus,
} from '../../../core/models/sale';
import { SalesService } from '../../../core/services/sales-service';
import { SaleDetail } from '../sale-detail/sale-detail';

type StatusFilter = 'all' | SaleStatus;

// Historial de ventas (mockup historial-ventas-view): listado filtrable y paginado por
// servidor a la izquierda y panel de detalle de la venta seleccionada a la derecha.
// Reusa el patrón de inventory-list (filtros + paginación de servidor con elipsis).
@Component({
  selector: 'app-sale-history',
  templateUrl: './sale-history.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  imports: [SaleDetail, CurrencyPipe, DatePipe],
})
export class SaleHistory {
  private readonly salesService = inject(SalesService);

  protected readonly pageSizes = SALE_PAGE_SIZES;
  protected readonly statusLabels = SALE_STATUS_LABELS;
  protected readonly paymentLabels = PAYMENT_METHOD_LABELS;
  protected readonly SaleStatus = SaleStatus;

  // Filtros y paginación.
  protected readonly search = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly status = signal<StatusFilter>('all');
  protected readonly page = signal(1);
  protected readonly pageSize = signal<number>(SALE_PAGE_SIZES[0]);

  // Datos y estado de la petición.
  protected readonly items = signal<SaleListItemDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Venta seleccionada para el panel de detalle.
  protected readonly selectedId = signal<number | null>(null);

  // Botones de página: primera/última y vecinas de la actual, con elipsis.
  protected readonly pageItems = computed<(number | '…')[]>(() => {
    const total = this.totalPages();
    const current = this.page();

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

    const result: (number | '…')[] = [];
    let previous = 0;
    for (const p of sorted) {
      if (p - previous > 1) {
        result.push('…');
      }
      result.push(p);
      previous = p;
    }
    return result;
  });

  protected readonly rangeStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalCount()),
  );

  constructor() {
    this.load();

    // Búsqueda por folio con debounce; skip(1) evita recargar con el valor inicial.
    toObservable(this.search)
      .pipe(skip(1), debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const status = this.status();
    this.salesService
      .getSales({
        from: this.from() || undefined,
        to: this.to() || undefined,
        folio: this.search().trim() || undefined,
        status: status === 'all' ? undefined : status,
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (response) => {
          this.items.set(response.items);
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

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  protected onFromChange(value: string): void {
    this.from.set(value);
    this.page.set(1);
    this.load();
  }

  protected onToChange(value: string): void {
    this.to.set(value);
    this.page.set(1);
    this.load();
  }

  protected onStatusChange(value: string): void {
    this.status.set(value === 'all' ? 'all' : (Number(value) as SaleStatus));
    this.page.set(1);
    this.load();
  }

  protected onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.from.set('');
    this.to.set('');
    this.status.set('all');
    this.page.set(1);
    this.load();
  }

  protected select(id: number): void {
    this.selectedId.set(id);
  }

  // Una venta cambió (cancelada/devuelta): refresca el listado para reflejar el estado.
  protected onSaleChanged(): void {
    this.load();
  }

  // Color del badge según el estado de la venta.
  protected statusClass(status: SaleStatus): string {
    switch (status) {
      case SaleStatus.Paid:
        return 'bg-green-100 text-green-700';
      case SaleStatus.Pending:
        return 'bg-amber-100 text-amber-700';
      case SaleStatus.Cancelled:
        return 'bg-red-100 text-red-700';
    }
  }
}
