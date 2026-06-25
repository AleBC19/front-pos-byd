import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  SaleDto,
  SaleStatus,
} from '../../../core/models/sale';
import { SalesService } from '../../../core/services/sales-service';
import { Modal } from '../../../shared/components/modal/modal';
import { printReceipt } from '../receipt-printer';
import { ReturnModal } from '../returns/return-modal';

// Panel derecho del historial (mockup historial-ventas-view): detalle de la venta
// seleccionada. Carga GET /api/sales/{id}, permite reimprimir el recibo, procesar una
// devolución y cancelar la venta. Avisa al contenedor (changed) para refrescar el listado.
@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.html',
  imports: [CurrencyPipe, DatePipe, Modal, ReturnModal],
})
export class SaleDetail {
  private readonly salesService = inject(SalesService);

  readonly saleId = input<number | null>(null);

  // Se emite tras cancelar o devolver para que el historial recargue la fila.
  readonly changed = output<void>();

  protected readonly labels = PAYMENT_METHOD_LABELS;
  protected readonly statusLabels = SALE_STATUS_LABELS;
  protected readonly SaleStatus = SaleStatus;

  protected readonly sale = signal<SaleDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly returnOpen = signal(false);
  protected readonly cancelOpen = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly cancelError = signal<string | null>(null);

  constructor() {
    // Carga el detalle cada vez que cambia la venta seleccionada.
    effect(() => {
      const id = this.saleId();
      if (id) {
        this.load(id);
      } else {
        this.sale.set(null);
      }
    });
  }

  protected reprint(): void {
    const sale = this.sale();
    if (!sale) {
      return;
    }
    this.salesService.getReceipt(sale.id).subscribe({
      next: (receipt) => {
        const message = printReceipt(receipt);
        if (message) {
          this.error.set(message);
        }
      },
      error: (err) => this.error.set(extractApiError(err).message),
    });
  }

  protected openReturn(): void {
    this.returnOpen.set(true);
  }

  protected onReturned(): void {
    const id = this.saleId();
    if (id) {
      this.load(id);
    }
    this.changed.emit();
  }

  protected askCancel(): void {
    this.cancelError.set(null);
    this.cancelOpen.set(true);
  }

  protected confirmCancel(): void {
    const sale = this.sale();
    if (!sale) {
      return;
    }
    this.cancelling.set(true);
    this.cancelError.set(null);
    this.salesService.cancelSale(sale.id).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.cancelOpen.set(false);
        this.load(sale.id);
        this.changed.emit();
      },
      error: (err) => {
        this.cancelling.set(false);
        this.cancelError.set(extractApiError(err).message);
      },
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.salesService.getSale(id).subscribe({
      next: (sale) => {
        this.sale.set(sale);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }
}
