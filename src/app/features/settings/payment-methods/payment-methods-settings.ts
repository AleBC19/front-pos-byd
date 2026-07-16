import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiError, extractApiError } from '../../../core/models/api';
import { SavePaymentSettingsRequest } from '../../../core/models/configuration';
import { ConfigurationService } from '../../../core/services/configuration-service';

// Configuración fija de los métodos de pago del punto de venta, conectada a
// /api/configuration/payment-methods (GET/PUT). El backend valida de forma
// condicional: los datos de tarjeta son obligatorios si débito o crédito están
// activos, y los de transferencia si la transferencia está activa.
@Component({
  selector: 'app-payment-methods-settings',
  templateUrl: './payment-methods-settings.html',
  imports: [ReactiveFormsModule],
})
export class PaymentMethodsSettings {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly configuration = inject(ConfigurationService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);

  protected readonly form = this.fb.group({
    cashEnabled: [true],
    debitCardEnabled: [false],
    creditCardEnabled: [false],
    bankTransferEnabled: [false],
    cardBank: ['', [Validators.maxLength(100)]],
    cardTerminalId: ['', [Validators.maxLength(50)]],
    transferAccountNumber: ['', [Validators.maxLength(50)]],
    transferAccountHolder: ['', [Validators.maxLength(150)]],
  });

  // Signal del valor del formulario para reaccionar a los toggles en la vista.
  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly cardEnabled = computed(
    () => !!this.value().debitCardEnabled || !!this.value().creditCardEnabled,
  );
  protected readonly transferEnabled = computed(() => !!this.value().bankTransferEnabled);

  constructor() {
    this.load();
  }

  protected toggle(
    control: 'cashEnabled' | 'debitCardEnabled' | 'creditCardEnabled' | 'bankTransferEnabled',
  ): void {
    const target = this.form.controls[control];
    target.setValue(!target.value);
    this.syncValidators();
    this.markChanged();
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected markChanged(): void {
    this.saved.set(false);
  }

  protected save(): void {
    this.syncValidators();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: SavePaymentSettingsRequest = {
      cashEnabled: value.cashEnabled,
      debitCardEnabled: value.debitCardEnabled,
      creditCardEnabled: value.creditCardEnabled,
      bankTransferEnabled: value.bankTransferEnabled,
      cardBank: value.cardBank.trim() || null,
      cardTerminalId: value.cardTerminalId.trim() || null,
      transferAccountNumber: value.transferAccountNumber.trim() || null,
      transferAccountHolder: value.transferAccountHolder.trim() || null,
    };

    this.saving.set(true);
    this.saved.set(false);
    this.apiError.set(null);

    this.configuration.savePaymentSettings(body).subscribe({
      next: (settings) => {
        this.saving.set(false);
        this.saved.set(true);
        this.apply(settings);
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.configuration.getPaymentSettings().subscribe({
      next: (settings) => {
        this.loading.set(false);
        this.apply(settings);
      },
      error: (err) => {
        this.loading.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  private apply(settings: SavePaymentSettingsRequest): void {
    this.form.reset({
      cashEnabled: settings.cashEnabled,
      debitCardEnabled: settings.debitCardEnabled,
      creditCardEnabled: settings.creditCardEnabled,
      bankTransferEnabled: settings.bankTransferEnabled,
      cardBank: settings.cardBank ?? '',
      cardTerminalId: settings.cardTerminalId ?? '',
      transferAccountNumber: settings.transferAccountNumber ?? '',
      transferAccountHolder: settings.transferAccountHolder ?? '',
    });
    this.syncValidators();
  }

  // Activa/desactiva "requerido" en los datos bancarios según los toggles,
  // reflejando SavePaymentSettingsRequestValidator del backend.
  private syncValidators(): void {
    const cardRequired =
      this.form.controls.debitCardEnabled.value || this.form.controls.creditCardEnabled.value;
    this.setConditionalRequired('cardBank', cardRequired, 100);
    this.setConditionalRequired('cardTerminalId', cardRequired, 50);

    const transferRequired = this.form.controls.bankTransferEnabled.value;
    this.setConditionalRequired('transferAccountNumber', transferRequired, 50);
    this.setConditionalRequired('transferAccountHolder', transferRequired, 150);
  }

  private setConditionalRequired(
    controlName: 'cardBank' | 'cardTerminalId' | 'transferAccountNumber' | 'transferAccountHolder',
    required: boolean,
    maxLength: number,
  ): void {
    const control = this.form.controls[controlName];
    control.setValidators(
      required
        ? [Validators.required, Validators.maxLength(maxLength)]
        : [Validators.maxLength(maxLength)],
    );
    control.updateValueAndValidity({ emitEvent: false });
  }
}
