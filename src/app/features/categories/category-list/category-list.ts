import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { extractApiError } from '../../../core/models/api';
import { CATEGORY_PAGE_SIZES, CategoryDto } from '../../../core/models/category';
import { CategoriesService } from '../../../core/services/categories-service';
import { Modal } from '../../../shared/components/modal/modal';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { CategoryForm } from '../category-form/category-form';

type StatusFilter = 'all' | 'active' | 'inactive';

// Vista de categorías conectada a /api/categories: búsqueda con debounce,
// filtro de estado, paginación de servidor y CRUD por fila
// (editar, eliminar, activar).
@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.html',
  imports: [SidePanel, Modal, CategoryForm],
})
export class CategoryList {
  private readonly categoriesService = inject(CategoriesService);

  protected readonly pageSizes = CATEGORY_PAGE_SIZES;

  // Filtros y paginación.
  protected readonly search = signal('');
  protected readonly status = signal<StatusFilter>('all');
  protected readonly page = signal(1);
  protected readonly pageSize = signal<number>(CATEGORY_PAGE_SIZES[0]);

  // Datos y estado de la petición.
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // El backend solo expone includeInactive, no un filtro "solo inactivos":
  // para "Inactivo" se filtra del lado del cliente sobre la página recibida
  // (los conteos quedan aproximados hasta que el API tenga filtro de estado).
  protected readonly visibleCategories = computed(() => {
    const categories = this.categories();
    return this.status() === 'inactive'
      ? categories.filter((category) => !category.isActive)
      : categories;
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
  protected readonly panelTitle = signal('Nueva categoría');
  protected readonly editingCategory = signal<CategoryDto | null>(null);

  // Modal de confirmación de eliminado.
  protected readonly deleteOpen = signal(false);
  protected readonly categoryToDelete = signal<CategoryDto | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
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

    this.categoriesService
      .getCategories({
        search: this.search().trim() || undefined,
        includeInactive: this.status() !== 'active',
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (response) => {
          this.categories.set(response.items);
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
    this.editingCategory.set(null);
    this.panelTitle.set('Nueva categoría');
    this.panelOpen.set(true);
  }

  protected openEdit(category: CategoryDto): void {
    this.editingCategory.set(category);
    this.panelTitle.set('Editar categoría');
    this.panelOpen.set(true);
  }

  protected onSaved(): void {
    this.panelOpen.set(false);
    this.editingCategory.set(null);
    this.load();
  }

  protected openDelete(category: CategoryDto): void {
    this.categoryToDelete.set(category);
    this.deleteOpen.set(true);
  }

  // Borrado suave: el API marca la categoría como inactiva. Falla si la
  // categoría tiene productos activos; el mensaje se muestra en el banner.
  protected confirmDelete(): void {
    const category = this.categoryToDelete();
    if (!category) {
      return;
    }

    this.deleting.set(true);
    this.categoriesService.deleteCategory(category.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.categoryToDelete.set(null);
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  // Reactiva una categoría dada de baja (borrado suave).
  protected activate(category: CategoryDto): void {
    this.categoriesService.activateCategory(category.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(extractApiError(err).message),
    });
  }
}
