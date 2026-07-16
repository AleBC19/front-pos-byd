import { Component, computed, inject, signal } from '@angular/core';
import { ApiError, extractApiError } from '../../../core/models/api';
import { ConfigurationService } from '../../../core/services/configuration-service';

// Configuración de impuestos conectada a /api/configuration/taxes (GET/PUT).
// El backend solo maneja "aplicar IVA" y la tasa (porcentaje 0-100).
@Component({
  selector: 'app-tax-settings',
  templateUrl: './tax-settings.html',
})
export class TaxSettings {
  private readonly configuration = inject(ConfigurationService);

  protected readonly applyIva = signal(true);
  protected readonly ivaRate = signal(16);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);

  // La tasa debe estar entre 0 y 100 cuando el IVA está activo.
  protected readonly rateInvalid = computed(() => {
    const rate = this.ivaRate();
    return this.applyIva() && (!Number.isFinite(rate) || rate < 0 || rate > 100);
  });

  constructor() {
    this.load();
  }

  protected toggleApplyIva(): void {
    this.applyIva.update((value) => !value);
    this.markChanged();
  }

  protected setRate(value: string): void {
    this.ivaRate.set(value === '' ? NaN : Number(value));
    this.markChanged();
  }

  protected markChanged(): void {
    this.saved.set(false);
  }

  protected save(): void {
    if (this.rateInvalid()) return;

    this.saving.set(true);
    this.saved.set(false);
    this.apiError.set(null);

    this.configuration.saveTaxes({ applyIva: this.applyIva(), ivaRate: this.ivaRate() }).subscribe({
      next: (settings) => {
        this.saving.set(false);
        this.saved.set(true);
        this.apply(settings.applyIva, settings.ivaRate);
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

    this.configuration.getTaxes().subscribe({
      next: (settings) => {
        this.loading.set(false);
        this.apply(settings.applyIva, settings.ivaRate);
      },
      error: (err) => {
        this.loading.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  private apply(applyIva: boolean, ivaRate: number): void {
    this.applyIva.set(applyIva);
    this.ivaRate.set(ivaRate);
  }
}
