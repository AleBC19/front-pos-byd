import { Component, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { extractApiError } from '../../../core/models/api';
import { CustomerDto } from '../../../core/models/customer';
import { CustomersService } from '../../../core/services/customers-service';

// Selector de cliente del ticket: búsqueda con debounce y alta rápida (POST /api/customers).
// null = sin cliente específico (el backend lo nombra "Público en general" en el recibo).
@Component({
  selector: 'app-customer-selector',
  templateUrl: './customer-selector.html',
  imports: [ReactiveFormsModule],
})
export class CustomerSelector {
  private readonly customersService = inject(CustomersService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly selected = input<CustomerDto | null>(null);
  readonly selectedChange = output<CustomerDto | null>();

  protected readonly open = signal(false);
  protected readonly search = signal('');
  protected readonly customers = signal<CustomerDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly showCreate = signal(false);
  protected readonly saving = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
    taxId: ['', [Validators.maxLength(30)]],
  });

  constructor() {
    // Búsqueda con debounce; skip(1) evita disparar con el valor inicial.
    toObservable(this.search)
      .pipe(skip(1), debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && !this.customers().length) {
      this.load();
    }
  }

  protected close(): void {
    this.open.set(false);
    this.showCreate.set(false);
    this.createError.set(null);
  }

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  protected choose(customer: CustomerDto | null): void {
    this.selectedChange.emit(customer);
    this.close();
  }

  protected toggleCreate(): void {
    this.showCreate.update((value) => !value);
    this.createError.set(null);
    if (this.showCreate()) {
      this.form.reset();
    }
  }

  protected createCustomer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.createError.set(null);

    this.customersService
      .createCustomer({
        name: value.name.trim(),
        email: value.email.trim() || undefined,
        phone: value.phone.trim() || undefined,
        taxId: value.taxId.trim() || undefined,
      })
      .subscribe({
        next: (customer) => {
          this.saving.set(false);
          this.choose(customer);
        },
        error: (err) => {
          this.saving.set(false);
          this.createError.set(extractApiError(err).message);
        },
      });
  }

  protected invalid(control: string): boolean {
    const ctrl = this.form.get(control);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.customersService
      .getCustomers({ search: this.search().trim() || undefined, pageSize: 20 })
      .subscribe({
        next: (response) => {
          this.customers.set(response.items);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(extractApiError(err).message);
        },
      });
  }
}
