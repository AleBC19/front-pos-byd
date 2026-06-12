import { Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError, extractApiError } from '../../../core/models/api';
import { CategoryDto, SaveCategoryRequest } from '../../../core/models/category';
import { CategoriesService } from '../../../core/services/categories-service';

// Formulario de alta/edición de categoría del panel lateral,
// conectado a /api/categories (POST al crear, PUT al editar).
@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.html',
  imports: [ReactiveFormsModule],
})
export class CategoryForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly categoriesService = inject(CategoriesService);

  // Categoría a editar; null = alta. El panel reutiliza la misma instancia,
  // por eso un effect repuebla o limpia el formulario cuando cambia.
  readonly category = input<CategoryDto | null>(null);

  readonly cancelled = output<void>();
  readonly saved = output<CategoryDto>();

  protected readonly saving = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    effect(() => {
      const category = this.category();
      this.apiError.set(null);

      if (category) {
        this.form.reset({
          name: category.name,
          description: category.description ?? '',
        });
      } else {
        this.form.reset();
      }
    });
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
    const body: SaveCategoryRequest = {
      name: value.name.trim(),
      description: value.description.trim() || undefined,
    };

    const current = this.category();
    const request = current
      ? this.categoriesService.updateCategory(current.id, body)
      : this.categoriesService.createCategory(body);

    this.saving.set(true);
    this.apiError.set(null);

    request.subscribe({
      next: (category) => {
        this.saving.set(false);
        this.saved.emit(category);
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }
}
