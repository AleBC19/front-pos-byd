import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Observable, of, switchMap } from 'rxjs';
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

// Límites de imagen alineados al backend: JPG/PNG/WEBP, máx. 3 MB.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Formulario de alta/edición de producto del panel lateral.
// Unidad, IVA, stock inicial y estado siguen deshabilitados:
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
  private readonly destroyRef = inject(DestroyRef);

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

  // Estado de la imagen. previewUrl puede ser la URL existente (/media/...)
  // o un objectURL local de un archivo recién elegido.
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly removeExisting = signal(false);
  protected readonly imageError = signal<string | null>(null);
  // objectURL local pendiente de revocar (evita fugas de memoria).
  private objectUrl: string | null = null;
  // Producto ya persistido en este intento: si la subida de imagen falla,
  // un reintento no vuelve a crear (evita error de código duplicado).
  private readonly savedProduct = signal<ProductDto | null>(null);

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
      this.resetImageState(product?.imageUrl ?? null);

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

    this.destroyRef.onDestroy(() => this.revokeObjectUrl());
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

    const current = this.product();
    const value = this.form.getRawValue();
    const body: SaveProductRequest = {
      code: value.code.trim(),
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      // Preserva la imagen actual en la edición (el PUT persiste imageUrl directo);
      // en el alta arranca en null y la subida real ocurre en el paso 2.
      imageUrl: current ? current.imageUrl : null,
      salePrice: Number(value.salePrice),
      purchasePrice: Number(value.purchasePrice),
      minimumStock: Number(value.minimumStock),
      categoryId: Number(value.categoryId),
    };

    // Alta ya creada en un intento previo cuya imagen falló: no recrear.
    const persisted = this.savedProduct();
    let save$: Observable<ProductDto>;
    if (current) {
      save$ = this.productsService.updateProduct(current.id, body); // edición: idempotente
    } else if (persisted) {
      save$ = of(persisted); // reintento de alta: solo la imagen
    } else {
      save$ = this.productsService.createProduct(body);
    }

    this.saving.set(true);
    this.apiError.set(null);
    this.imageError.set(null);

    save$
      .pipe(
        switchMap((product) => {
          this.savedProduct.set(product); // el producto ya quedó guardado
          return this.applyImage(product);
        }),
      )
      .subscribe({
        next: (product) => {
          this.saving.set(false);
          this.saved.emit(product);
        },
        error: (err) => {
          this.saving.set(false);
          // Si el producto ya se guardó, el error viene del paso de imagen.
          if (this.savedProduct()) {
            this.imageError.set(
              'El producto se guardó, pero la imagen no se pudo subir. Volvé a intentar.',
            );
          } else {
            this.apiError.set(extractApiError(err));
          }
        },
      });
  }

  // Aplica el cambio de imagen sobre el producto ya guardado (paso 2).
  private applyImage(product: ProductDto): Observable<ProductDto> {
    const file = this.selectedFile();
    if (file) {
      return this.productsService.uploadImage(product.id, file);
    }
    if (this.removeExisting()) {
      return this.productsService.deleteImage(product.id);
    }
    return of(product);
  }

  // Selección de archivo (input o drag&drop): valida tipo y tamaño en cliente.
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
    input.value = ''; // permite volver a elegir el mismo archivo
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setFile(file: File | null): void {
    if (!file) {
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageError.set('Formato no válido. Usá JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.imageError.set('La imagen no debe superar 3 MB.');
      return;
    }
    this.imageError.set(null);
    this.selectedFile.set(file);
    this.removeExisting.set(false);
    this.setPreview(URL.createObjectURL(file), true);
  }

  // Quita la imagen: si había una existente, la marca para borrar al guardar.
  protected onRemoveImage(): void {
    this.imageError.set(null);
    this.selectedFile.set(null);
    if (this.product()?.imageUrl) {
      this.removeExisting.set(true); // borrar la imagen existente al guardar
    }
    this.setPreview(null, false);
  }

  // Reinicia el estado de imagen al abrir/cambiar de producto en el panel.
  private resetImageState(existingUrl: string | null): void {
    this.selectedFile.set(null);
    this.removeExisting.set(false);
    this.imageError.set(null);
    this.savedProduct.set(null);
    this.setPreview(existingUrl, false);
  }

  private setPreview(url: string | null, isObjectUrl: boolean): void {
    this.revokeObjectUrl();
    this.objectUrl = isObjectUrl ? url : null;
    this.previewUrl.set(url);
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
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
