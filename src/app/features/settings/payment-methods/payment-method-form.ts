import { Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentMethod, PaymentMethodFormValue } from './payment-method.models';

@Component({
  selector: 'app-payment-method-form',
  templateUrl: './payment-method-form.html',
  imports: [ReactiveFormsModule],
})
export class PaymentMethodForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly method = input<PaymentMethod | null>(null);
  readonly reservedNames = input<string[]>([]);

  readonly saved = output<PaymentMethodFormValue>();
  readonly cancelled = output<void>();

  protected readonly duplicateName = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    enabled: [true],
  });

  constructor() {
    effect(() => {
      const method = this.method();
      this.reservedNames();
      this.duplicateName.set(false);
      this.form.reset({
        name: method?.name ?? '',
        description: method?.description ?? '',
        enabled: method?.enabled ?? true,
      });
    });
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected clearDuplicateError(): void {
    this.duplicateName.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const normalizedName = value.name.trim();
    const duplicated = this.reservedNames().some(
      (name) => name.trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase(),
    );

    if (duplicated) {
      this.duplicateName.set(true);
      return;
    }

    this.saved.emit({
      name: normalizedName,
      description: value.description.trim(),
      enabled: value.enabled,
    });
  }
}
