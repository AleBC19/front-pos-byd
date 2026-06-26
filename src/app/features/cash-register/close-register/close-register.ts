import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError, extractApiError } from '../../../core/models/api';
import {
  CashRegisterSessionDto,
  CashSessionSummaryDto,
  CloseSessionRequest,
} from '../../../core/models/cash-register';
import { PAYMENT_METHOD_LABELS } from '../../../core/models/sale';
import { CashRegisterService } from '../../../core/services/cash-register-service';
import { printCashCut } from '../cash-cut-printer';

// Pantalla de cierre de turno (POST /api/cash-register/sessions/{id}/close). Consulta el
// turno abierto y su corte en vivo, captura el efectivo contado y, al cerrar, muestra el
// corte resultante con opción de imprimirlo.
@Component({
  selector: 'app-close-register',
  templateUrl: './close-register.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
})
export class CloseRegister {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cashRegisterService = inject(CashRegisterService);

  protected readonly paymentLabels = PAYMENT_METHOD_LABELS;

  protected readonly loading = signal(true);
  protected readonly current = signal<CashRegisterSessionDto | null>(null);
  protected readonly summary = signal<CashSessionSummaryDto | null>(null);
  protected readonly saving = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);

  // Corte resultante tras cerrar: muestra el estado de éxito.
  protected readonly closed = signal<CashSessionSummaryDto | null>(null);

  protected readonly form = this.fb.group({
    declaredAmount: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)],
    ],
    notes: ['', [Validators.maxLength(500)]],
  });

  // Valor del efectivo contado como signal para recalcular la diferencia en vivo.
  private readonly declaredValue = toSignal(this.form.controls.declaredAmount.valueChanges, {
    initialValue: null as number | null,
  });

  // Diferencia en vivo: efectivo contado - efectivo esperado del corte.
  protected readonly liveDifference = computed<number | null>(() => {
    const summary = this.summary();
    const declared = this.declaredValue();
    if (!summary || declared === null) {
      return null;
    }
    return Number(declared) - summary.expectedCash;
  });

  constructor() {
    this.loadCurrent();
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    const session = this.current();
    if (!session || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: CloseSessionRequest = {
      declaredAmount: Number(value.declaredAmount),
      notes: value.notes.trim() || undefined,
    };

    this.saving.set(true);
    this.apiError.set(null);

    this.cashRegisterService.closeSession(session.id, body).subscribe({
      next: (summary) => {
        this.saving.set(false);
        this.closed.set(summary);
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  protected print(): void {
    const summary = this.closed();
    if (!summary) {
      return;
    }
    const message = printCashCut(summary);
    if (message) {
      this.apiError.set({ message, details: [] });
    }
  }

  private loadCurrent(): void {
    this.loading.set(true);
    this.cashRegisterService.getCurrent().subscribe({
      next: (session) => {
        this.current.set(session);
        if (session) {
          this.loadSummary(session.id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.current.set(null);
        this.loading.set(false);
      },
    });
  }

  private loadSummary(id: number): void {
    this.cashRegisterService.getSummary(id).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (err) => {
        this.apiError.set(extractApiError(err));
        this.loading.set(false);
      },
    });
  }
}
