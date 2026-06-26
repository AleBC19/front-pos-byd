import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { CashSessionSummaryDto } from '../../../core/models/cash-register';
import { extractApiError } from '../../../core/models/api';
import { PAYMENT_METHOD_LABELS } from '../../../core/models/sale';
import { CashRegisterService } from '../../../core/services/cash-register-service';
import { printCashCut } from '../cash-cut-printer';

// Panel derecho del historial de cierres: corte del turno seleccionado.
// Carga GET /api/cash-register/sessions/{id}/summary y permite imprimir el corte.
@Component({
  selector: 'app-cash-cut-detail',
  templateUrl: './cash-cut-detail.html',
  imports: [CurrencyPipe, DatePipe],
})
export class CashCutDetail {
  private readonly cashRegisterService = inject(CashRegisterService);

  readonly sessionId = input<number | null>(null);

  protected readonly paymentLabels = PAYMENT_METHOD_LABELS;

  protected readonly summary = signal<CashSessionSummaryDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Carga el corte cada vez que cambia el turno seleccionado.
    effect(() => {
      const id = this.sessionId();
      if (id) {
        this.load(id);
      } else {
        this.summary.set(null);
      }
    });
  }

  protected print(): void {
    const summary = this.summary();
    if (!summary) {
      return;
    }
    const message = printCashCut(summary);
    if (message) {
      this.error.set(message);
    }
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.cashRegisterService.getSummary(id).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }
}
