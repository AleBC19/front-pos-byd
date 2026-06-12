import { Component, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ApiError, extractApiError } from '../../../core/models/api';
import { CategoryDto } from '../../../core/models/category';
import { ProductDto, SaveProductRequest } from '../../../core/models/product';
import { CategoriesService } from '../../../core/services/categories-service';
import { ProductsService } from '../../../core/services/products-service';
import { PRODUCT_TAX_RATES, PRODUCT_UNITS } from '../data/products-mock';

// El precio de venta debe ser mayor o igual al costo (regla del backend).
function salePriceGteCost(group: AbstractControl): ValidationErrors | null {
  const sale = Number(group.get('salePrice')?.value);
  const cost = Number(group.get('purchasePrice')?.value);
  return sale && cost > sale ? { salePriceBelowCost: true } : null;
}

// Formulario de alta/edición de producto del panel lateral.
// Unidad, IVA, imagen, stock inicial y estado siguen deshabilitados:
// el API aún no los soporta (el stock se gestiona desde inventario).
@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.html',
  imports: [ReactiveFormsModule],
})
export class ProductForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  // Producto a editar; null = alta. El panel reutiliza la misma instancia,
  // por eso un effect repuebla o limpia el formulario cuando cambia.
  readonly product = input<ProductDto | null>(null);

  readonly cancelled = output<void>();
  readonly saved = output<ProductDto>();

  protected readonly units = PRODUCT_UNITS;
  protected readonly taxRates = PRODUCT_TAX_RATES;

  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly saving = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);

  // Muestra/oculta los inputs de alta rápida de categoría (botón "+").
  protected readonly showCategoryForm = signal(false);
  protected readonly savingCategory = signal(false);
  protected readonly categoryError = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      code: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^\S+$/)]],
      description: ['', [Validators.maxLength(500)]],
      categoryId: [0, [Validators.required, Validators.min(1)]],
      salePrice: [null as number | null, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      purchasePrice: [null as number | null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
    },
    { validators: salePriceGteCost },
  );

  protected readonly categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.loadCategories();

    effect(() => {
      const product = this.product();
      this.apiError.set(null);
      this.showCategoryForm.set(false);

      if (product) {
        this.form.reset({
          name: product.name,
          code: product.code,
          description: product.description ?? '',
          categoryId: product.categoryId,
          salePrice: product.salePrice,
          purchasePrice: product.purchasePrice,
          minimumStock: product.minimumStock,
        });
      } else {
        this.form.reset();
      }
    });
  }

  protected get isEdit(): boolean {
    return this.product() !== null;
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
    const body: SaveProductRequest = {
      code: value.code.trim(),
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      salePrice: Number(value.salePrice),
      purchasePrice: Number(value.purchasePrice),
      minimumStock: Number(value.minimumStock),
      categoryId: Number(value.categoryId),
    };

    const current = this.product();
    const request = current
      ? this.productsService.updateProduct(current.id, body)
      : this.productsService.createProduct(body);

    this.saving.set(true);
    this.apiError.set(null);

    request.subscribe({
      next: (product) => {
        this.saving.set(false);
        this.saved.emit(product);
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  protected createCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();
    this.savingCategory.set(true);
    this.categoryError.set(null);

    this.categoriesService
      .createCategory({ name: value.name.trim(), description: value.description.trim() || undefined })
      .subscribe({
        next: (category) => {
          this.savingCategory.set(false);
          this.categories.update((list) => [...list, category]);
          this.form.patchValue({ categoryId: category.id });
          this.categoryForm.reset();
          this.showCategoryForm.set(false);
        },
        error: (err) => {
          this.savingCategory.set(false);
          this.categoryError.set(extractApiError(err).message);
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
