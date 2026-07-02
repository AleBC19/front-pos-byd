import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { extractApiError } from '../../../core/models/api';
import { RETURN_PAGE_SIZES, ReturnListItemDto } from '../../../core/models/return';
import { ReturnsService } from '../../../core/services/returns-service';
import { SalesService } from '../../../core/services/sales-service';
import { ReturnDetail } from '../return-detail/return-detail';

// Historial de devoluciones: listado global filtrable y paginado por servidor a la
// izquierda y detalle de la devolución seleccionada a la derecha (reusa el patrón de
// sale-history). El backend no filtra por folio, así que el folio se resuelve a la
// venta con SalesService y se filtra el listado por saleId.
@Component({
  selector: 'app-returns-history',
  templateUrl: './returns-history.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  imports: [ReturnDetail, CurrencyPipe, DatePipe],
})
export class ReturnsHistory {
  private readonly returnsService = inject(ReturnsService);
  private readonly salesService = inject(SalesService);

  protected readonly pageSizes = RETURN_PAGE_SIZES;

  // Filtros y paginación.
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly folio = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal<number>(RETURN_PAGE_SIZES[0]);

  // Datos y estado de la petición.
  protected readonly items = signal<ReturnListItemDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Devolución seleccionada para el panel de detalle.
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
    toObservable(this.folio)
      .pipe(skip(1), debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const folio = this.folio().trim();
    if (!folio) {
      this.fetchReturns(undefined);
      return;
    }

    // No hay filtro por folio en el backend: se resuelve el folio a una venta y se
    // filtra el listado por su saleId.
    this.salesService.getSales({ folio, pageSize: 1 }).subscribe({
      next: (response) => {
        const saleId = response.items[0]?.id;
        if (!saleId) {
          this.items.set([]);
          this.totalCount.set(0);
          this.totalPages.set(0);
          this.loading.set(false);
          return;
        }
        this.fetchReturns(saleId);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  private fetchReturns(saleId: number | undefined): void {
    this.returnsService
      .getReturns({
        from: this.from() || undefined,
        to: this.to() || undefined,
        saleId,
        desc: true, // más recientes primero (sortBy por defecto = fecha)
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

  protected onFolio(value: string): void {
    this.folio.set(value);
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
    this.from.set('');
    this.to.set('');
    this.folio.set('');
    this.page.set(1);
    this.load();
  }

  protected select(id: number): void {
    this.selectedId.set(id);
  }
}
