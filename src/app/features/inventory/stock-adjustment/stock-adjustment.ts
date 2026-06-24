import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiError, extractApiError } from '../../../core/models/api';
import {
  CreateInventoryMovementRequest,
  InventoryMovementType,
  INVENTORY_REASONS,
  MANUAL_MOVEMENT_TYPES,
} from '../../../core/models/inventory';
import { PRODUCT_PAGE_SIZES, ProductDto } from '../../../core/models/product';
import { PRODUCT_UNITS } from '../../products/data/products-mock';
import { InventoryService } from '../../../core/services/inventory-service';
import { ProductsService } from '../../../core/services/products-service';

// Panel "Ajustar stock": registra un movimiento manual contra
// /api/inventory/movements. El motivo elegido y el comentario opcional
// se concatenan en el único campo `reason` que acepta el API.
@Component({
  selector: 'app-stock-adjustment',
  templateUrl: './stock-adjustment.html',
  imports: [ReactiveFormsModule],
})
export class StockAdjustment {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly productsService = inject(ProductsService);

  // Producto preseleccionado al abrir el panel desde una fila de la tabla.
  readonly product = input<ProductDto | null>(null);

  readonly cancelled = output<void>();
  readonly saved = output<void>();

  protected readonly movementTypes = MANUAL_MOVEMENT_TYPES;
  protected readonly units = PRODUCT_UNITS;

  // Fecha y hora actual (solo informativa; el backend sella la real al guardar).
  protected readonly now = new Date().toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  protected readonly products = signal<ProductDto[]>([]);
  protected readonly saving = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);

  // Autocompletado del producto: texto escrito y visibilidad del desplegable.
  protected readonly productQuery = signal('');
  protected readonly showProductList = signal(false);

  // Coincidencias por nombre o código (máx. 50) según lo escrito.
  protected readonly filteredProducts = computed(() => {
    const query = this.productQuery().trim().toLowerCase();
    const all = this.products();
    const matches = query
      ? all.filter(
          (product) =>
            product.name.toLowerCase().includes(query) ||
            product.code.toLowerCase().includes(query),
        )
      : all;
    return matches.slice(0, 50);
  });

  protected readonly form = this.fb.group({
    type: [InventoryMovementType.In as InventoryMovementType, [Validators.required]],
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [null as number | null, [Validators.required, Validators.min(0)]],
    reason: ['', [Validators.required]],
    comment: ['', [Validators.maxLength(160)]],
  });

  // Signals derivadas de los controles para calcular la vista previa.
  private readonly typeValue = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });
  private readonly productIdValue = toSignal(this.form.controls.productId.valueChanges, {
    initialValue: this.form.controls.productId.value,
  });
  private readonly quantityValue = toSignal(this.form.controls.quantity.valueChanges, {
    initialValue: this.form.controls.quantity.value,
  });

  // Motivos predefinidos según el tipo de movimiento seleccionado.
  protected readonly reasons = computed(() => INVENTORY_REASONS[this.typeValue()] ?? []);

  protected readonly selectedProduct = computed(
    () => this.products().find((product) => product.id === Number(this.productIdValue())) ?? null,
  );

  protected readonly currentStock = computed(() => this.selectedProduct()?.stock ?? null);

  // Stock resultante previsto: Entrada suma, Salida resta, Ajuste fija el valor absoluto.
  protected readonly resultingStock = computed(() => {
    const stock = this.currentStock();
    const raw = this.quantityValue();
    if (stock === null || raw === null) {
      return null;
    }
    const quantity = Number(raw);
    switch (this.typeValue()) {
      case InventoryMovementType.In:
        return stock + quantity;
      case InventoryMovementType.Out:
        return stock - quantity;
      case InventoryMovementType.Adjustment:
        return quantity;
      default:
        return null;
    }
  });

  // Etiqueta del campo cantidad: en Ajuste es el conteo físico (stock final).
  protected readonly quantityLabel = computed(() =>
    this.typeValue() === InventoryMovementType.Adjustment ? 'Stock final (conteo físico)' : 'Cantidad',
  );

  constructor() {
    this.loadProducts();

    // Preselecciona el producto recibido y limpia el formulario al reabrir.
    effect(() => {
      const product = this.product();
      this.apiError.set(null);
      this.showProductList.set(false);
      this.productQuery.set(product ? this.productLabel(product) : '');
      this.form.reset({
        type: InventoryMovementType.In,
        productId: product?.id ?? 0,
        quantity: null,
        reason: '',
        comment: '',
      });
    });
  }

  protected productLabel(product: ProductDto): string {
    return `${product.name} (${product.code})`;
  }

  // El usuario escribe: se muestra el desplegable y se invalida la selección
  // previa hasta que elija una coincidencia de la lista.
  protected onProductInput(value: string): void {
    this.productQuery.set(value);
    this.showProductList.set(true);
    this.form.patchValue({ productId: 0 });
  }

  protected selectProduct(product: ProductDto): void {
    this.form.patchValue({ productId: product.id });
    this.productQuery.set(this.productLabel(product));
    this.showProductList.set(false);
  }

  // Cierra el desplegable con un pequeño retardo para no cancelar el click en una opción.
  protected closeProductList(): void {
    setTimeout(() => this.showProductList.set(false), 150);
  }

  protected selectType(type: InventoryMovementType): void {
    // Al cambiar de tipo, el catálogo de motivos cambia: se limpia la selección previa.
    this.form.patchValue({ type, reason: '' });
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const comment = value.comment.trim();
    const reason = (comment ? `${value.reason} - ${comment}` : value.reason).slice(0, 200);

    const body: CreateInventoryMovementRequest = {
      productId: Number(value.productId),
      type: value.type,
      quantity: Number(value.quantity),
      reason,
    };

    this.saving.set(true);
    this.apiError.set(null);

    this.inventoryService.createMovement(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  private loadProducts(): void {
    // El endpoint de productos solo acepta los tamaños de PRODUCT_PAGE_SIZES;
    // se usa el mayor permitido y se piden las páginas restantes para poblar el selector.
    const pageSize = PRODUCT_PAGE_SIZES[PRODUCT_PAGE_SIZES.length - 1];

    this.productsService.getProducts({ page: 1, pageSize }).subscribe({
      next: (response) => {
        this.products.set(response.items);

        if (response.totalPages > 1) {
          const rest = [];
          for (let page = 2; page <= response.totalPages; page++) {
            rest.push(this.productsService.getProducts({ page, pageSize }));
          }
          forkJoin(rest).subscribe({
            next: (pages) =>
              this.products.update((list) => [...list, ...pages.flatMap((p) => p.items)]),
            error: () => {},
          });
        }
      },
      error: () => this.products.set([]),
    });
  }
}
