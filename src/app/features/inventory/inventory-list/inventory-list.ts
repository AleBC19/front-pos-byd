import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { extractApiError } from '../../../core/models/api';
import { CategoryDto } from '../../../core/models/category';
import {
  InventoryItemDto,
  InventoryStockStatus,
  InventorySummaryDto,
  INVENTORY_PAGE_SIZES,
  STOCK_STATUS_LABELS,
} from '../../../core/models/inventory';
import { ProductDto } from '../../../core/models/product';
import { CategoriesService } from '../../../core/services/categories-service';
import { InventoryService } from '../../../core/services/inventory-service';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { Kardex } from '../kardex/kardex';
import { StockAdjustment } from '../stock-adjustment/stock-adjustment';

type StatusFilter = 'all' | InventoryStockStatus;

// Vista de inventario conectada a /api/inventory: KPIs, estado de stock por
// producto (búsqueda con debounce, filtros, paginación de servidor), panel de
// ajuste de stock y kardex de movimientos.
@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.html',
  imports: [SidePanel, StockAdjustment, Kardex, CurrencyPipe],
})
export class InventoryList {
  private readonly inventoryService = inject(InventoryService);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly pageSizes = INVENTORY_PAGE_SIZES;
  protected readonly statusLabels = STOCK_STATUS_LABELS;

  // KPIs del encabezado.
  protected readonly summary = signal<InventorySummaryDto | null>(null);

  // Filtros y paginación.
  protected readonly search = signal('');
  protected readonly categoryId = signal<number | null>(null);
  protected readonly status = signal<StatusFilter>('all');
  protected readonly page = signal(1);
  protected readonly pageSize = signal<number>(INVENTORY_PAGE_SIZES[0]);

  // Datos y estado de la petición.
  protected readonly items = signal<InventoryItemDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exporting = signal(false);

  protected readonly categories = signal<CategoryDto[]>([]);

  // Token que fuerza la recarga del kardex tras guardar un movimiento.
  protected readonly kardexRefresh = signal(0);

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

  // Panel lateral de ajuste de stock.
  protected readonly panelOpen = signal(false);
  protected readonly selectedProduct = signal<ProductDto | null>(null);

  constructor() {
    this.loadCategories();
    this.loadSummary();
    this.load();

    // Búsqueda con debounce; skip(1) evita recargar con el valor inicial.
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
    this.inventoryService
      .getStatus({
        search: this.search().trim() || undefined,
        categoryId: this.categoryId() ?? undefined,
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

  protected onCategoryChange(value: string): void {
    this.categoryId.set(value ? Number(value) : null);
    this.page.set(1);
    this.load();
  }

  protected onStatusChange(value: string): void {
    this.status.set(value as StatusFilter);
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

  protected openAdjust(item?: InventoryItemDto): void {
    // El panel reutiliza el DTO de producto; basta con id y stock para la vista previa.
    this.selectedProduct.set(
      item
        ? ({ id: item.productId, code: item.code, name: item.name, stock: item.stock } as ProductDto)
        : null,
    );
    this.panelOpen.set(true);
  }

  protected onSaved(): void {
    this.panelOpen.set(false);
    this.selectedProduct.set(null);
    this.loadSummary();
    this.load();
    // Fuerza la recarga del kardex.
    this.kardexRefresh.update((token) => token + 1);
  }

  protected export(): void {
    this.exporting.set(true);
    this.inventoryService.exportInventory().subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventario.xlsx';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.exporting.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  // Color del badge de estado de stock.
  protected statusClass(status: InventoryStockStatus): string {
    switch (status) {
      case 'InStock':
        return 'bg-green-100 text-green-700';
      case 'LowStock':
        return 'bg-orange-100 text-orange-700';
      case 'OutOfStock':
        return 'bg-red-100 text-red-700';
    }
  }

  private loadSummary(): void {
    this.inventoryService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.summary.set(null),
    });
  }

  private loadCategories(): void {
    this.categoriesService.getCategories({ pageSize: 50, includeInactive: true }).subscribe({
      next: (response) => this.categories.set(response.items),
      error: () => this.categories.set([]),
    });
  }
}
