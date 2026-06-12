import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { extractApiError } from '../../../core/models/api';
import { CategoryDto } from '../../../core/models/category';
import { PRODUCT_PAGE_SIZES, ProductDto } from '../../../core/models/product';
import { CategoriesService } from '../../../core/services/categories-service';
import { ProductsService } from '../../../core/services/products-service';
import { Modal } from '../../../shared/components/modal/modal';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { ProductForm } from '../product-form/product-form';

type StatusFilter = 'all' | 'active' | 'inactive';

// Vista de productos conectada a /api/products: búsqueda con debounce,
// filtros, paginación de servidor y CRUD por fila (editar, eliminar, activar).
// La barra de selección múltiple sigue siendo visual: el API no tiene
// endpoints bulk todavía.
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.html',
  imports: [SidePanel, Modal, ProductForm, CurrencyPipe],
})
export class ProductList {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly pageSizes = PRODUCT_PAGE_SIZES;

  // Filtros y paginación.
  protected readonly search = signal('');
  protected readonly categoryId = signal<number | null>(null);
  protected readonly status = signal<StatusFilter>('all');
  protected readonly page = signal(1);
  protected readonly pageSize = signal<number>(PRODUCT_PAGE_SIZES[0]);

  // Datos y estado de la petición.
  protected readonly products = signal<ProductDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly categories = signal<CategoryDto[]>([]);
  // El DTO de producto solo trae categoryId; este mapa resuelve el nombre.
  protected readonly categoryNames = computed(
    () => new Map(this.categories().map((category) => [category.id, category.name])),
  );

  // El backend solo expone includeInactive, no un filtro "solo inactivos":
  // para "Inactivo" se filtra del lado del cliente sobre la página recibida
  // (los conteos quedan aproximados hasta que el API tenga filtro de estado).
  protected readonly visibleProducts = computed(() => {
    const products = this.products();
    return this.status() === 'inactive' ? products.filter((product) => !product.isActive) : products;
  });

  // Botones de página: primera/última y vecinas de la actual, con elipsis.
  protected readonly pageItems = computed<(number | '…')[]>(() => {
    const total = this.totalPages();
    const current = this.page();

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

    const items: (number | '…')[] = [];
    let previous = 0;
    for (const p of sorted) {
      if (p - previous > 1) {
        items.push('…');
      }
      items.push(p);
      previous = p;
    }
    return items;
  });

  protected readonly rangeStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalCount()),
  );

  // Panel lateral de alta/edición.
  protected readonly panelOpen = signal(false);
  protected readonly panelTitle = signal('Nuevo producto');
  protected readonly editingProduct = signal<ProductDto | null>(null);

  // Modal de confirmación de eliminado.
  protected readonly deleteOpen = signal(false);
  protected readonly productToDelete = signal<ProductDto | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
    this.loadCategories();
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

    this.productsService
      .getProducts({
        search: this.search().trim() || undefined,
        categoryId: this.categoryId() ?? undefined,
        includeInactive: this.status() !== 'active',
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
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

  protected openCreate(): void {
    this.editingProduct.set(null);
    this.panelTitle.set('Nuevo producto');
    this.panelOpen.set(true);
  }

  protected openEdit(product: ProductDto): void {
    this.editingProduct.set(product);
    this.panelTitle.set('Editar producto');
    this.panelOpen.set(true);
  }

  protected onSaved(): void {
    this.panelOpen.set(false);
    this.editingProduct.set(null);
    this.load();
  }

  protected openDelete(product: ProductDto): void {
    this.productToDelete.set(product);
    this.deleteOpen.set(true);
  }

  protected confirmDelete(): void {
    const product = this.productToDelete();
    if (!product) {
      return;
    }

    this.deleting.set(true);
    this.productsService.deleteProduct(product.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.productToDelete.set(null);
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  // Reactiva un producto dado de baja (borrado suave).
  protected activate(product: ProductDto): void {
    this.productsService.activateProduct(product.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(extractApiError(err).message),
    });
  }

  private loadCategories(): void {
    // includeInactive para poder mostrar la categoría de productos inactivos.
    this.categoriesService.getCategories({ pageSize: 50, includeInactive: true }).subscribe({
      next: (response) => this.categories.set(response.items),
      error: () => this.categories.set([]),
    });
  }
}
