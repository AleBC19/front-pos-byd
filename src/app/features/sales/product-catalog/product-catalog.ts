import { CurrencyPipe } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { extractApiError } from '../../../core/models/api';
import { CategoryDto } from '../../../core/models/category';
import { ProductDto } from '../../../core/models/product';
import { CategoriesService } from '../../../core/services/categories-service';
import { ProductsService } from '../../../core/services/products-service';

// Catálogo del punto de venta: búsqueda con debounce, escaneo por código (Enter),
// filtro por categoría en pestañas y grid de productos. Emite (addProduct) al pulsar
// "Agregar"; el contenedor (NewSale) es el dueño del carrito.
@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.html',
  imports: [CurrencyPipe],
})
export class ProductCatalog {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly addProduct = output<ProductDto>();

  protected readonly search = signal('');
  protected readonly categoryId = signal<number | null>(null);

  protected readonly products = signal<ProductDto[]>([]);
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly scanError = signal<string | null>(null);

  // Marcadores visuales de "Ventas en espera" (sección deshabilitada: el backend
  // no soporta ventas suspendidas).
  protected readonly heldPlaceholders = [
    { folio: 'Venta en espera #0001', amount: 85 },
    { folio: 'Venta en espera #0002', amount: 142.5 },
  ];

  constructor() {
    this.loadCategories();
    this.load();

    // Búsqueda con debounce; skip(1) evita recargar con el valor inicial.
    toObservable(this.search)
      .pipe(skip(1), debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  protected onSearch(value: string): void {
    this.scanError.set(null);
    this.search.set(value);
  }

  // Enter en el buscador: intenta resolver el texto como código de barras.
  protected onScan(): void {
    const code = this.search().trim();
    if (!code) {
      return;
    }
    this.scanError.set(null);
    this.productsService.getByCode(code).subscribe({
      next: (product) => {
        this.addProduct.emit(product);
        this.search.set('');
      },
      error: (err) => {
        const notFound = err instanceof HttpErrorResponse && err.status === 404;
        this.scanError.set(
          notFound ? `Producto no encontrado: ${code}` : extractApiError(err).message,
        );
      },
    });
  }

  protected selectCategory(id: number | null): void {
    this.categoryId.set(id);
    this.load();
  }

  protected add(product: ProductDto): void {
    if (product.stock <= 0) {
      return;
    }
    this.addProduct.emit(product);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsService
      .getProducts({
        search: this.search().trim() || undefined,
        categoryId: this.categoryId() ?? undefined,
        includeInactive: false,
        page: 1,
        pageSize: 60,
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(extractApiError(err).message);
        },
      });
  }

  private loadCategories(): void {
    this.categoriesService.getCategories({ pageSize: 50 }).subscribe({
      next: (response) => this.categories.set(response.items),
      error: () => this.categories.set([]),
    });
  }
}
