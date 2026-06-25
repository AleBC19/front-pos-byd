import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { CustomerDto } from '../../../core/models/customer';
import {
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  QUICK_CASH_AMOUNTS,
  ReceiptDto,
  SaleDto,
  SalePaymentRequest,
  SELECTABLE_PAYMENT_METHODS,
} from '../../../core/models/sale';
import { SalesService } from '../../../core/services/sales-service';
import { Modal } from '../../../shared/components/modal/modal';
import { CartItem, computeTotals, toCents } from '../cart-item';
import { printReceipt } from '../receipt-printer';

// Una fila del pago dividido (mixto).
interface SplitRow {
  method: PaymentMethod;
  amount: number | null;
}

// Modal de cobro (mockup modal-payment-view): pago simple o dividido, monto recibido
// y cambio, registro de la venta (POST /api/sales) y, al confirmar, recibo con
// imprimir/enviar por correo. Toda la aritmética se hace en centavos para cuadrar
// exactamente con el backend (de lo contrario respondería 409).
@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.html',
  imports: [Modal, CurrencyPipe],
})
export class PaymentModal {
  private readonly salesService = inject(SalesService);

  readonly open = model(false);
  readonly lines = input<CartItem[]>([]);
  readonly customer = input<CustomerDto | null>(null);
  // Si se indica, el modal cobra una venta en espera (POST /sales/{id}/resume) en vez de
  // registrar una venta nueva. Las líneas ya quedaron fijadas al dejarla en espera.
  readonly resumeSaleId = input<number | null>(null);

  readonly confirmed = output<SaleDto>();
  readonly cancelled = output<void>();

  protected readonly methods = SELECTABLE_PAYMENT_METHODS;
  protected readonly labels = PAYMENT_METHOD_LABELS;
  protected readonly quickAmounts = QUICK_CASH_AMOUNTS;
  protected readonly Cash = PaymentMethod.Cash;

  // Estado del cobro.
  protected readonly stage = signal<'pay' | 'done'>('pay');
  protected readonly method = signal<PaymentMethod>(PaymentMethod.Cash);
  protected readonly amountReceived = signal<number | null>(null);
  protected readonly split = signal(false);
  protected readonly splitRows = signal<SplitRow[]>([]);
  protected readonly processing = signal(false);
  protected readonly error = signal<string | null>(null);

  // Estado posterior a la venta.
  protected readonly sale = signal<SaleDto | null>(null);
  protected readonly receipt = signal<ReceiptDto | null>(null);
  protected readonly emailInput = signal('');
  protected readonly emailSending = signal(false);
  protected readonly emailSent = signal(false);
  protected readonly emailError = signal<string | null>(null);

  // Totales calculados igual que el backend (centavos, IVA sobre subtotal agregado).
  protected readonly totals = computed(() => computeTotals(this.lines()));
  protected readonly subtotal = computed(() => this.totals().subtotalCents / 100);
  protected readonly taxes = computed(() => this.totals().taxesCents / 100);
  protected readonly grandTotal = computed(() => this.totals().totalCents / 100);
  protected readonly totalCents = computed(() => this.totals().totalCents);

  // Cambio (vista previa) del pago simple en efectivo.
  protected readonly change = computed(() =>
    Math.max(0, (this.amountReceived() ?? 0) - this.grandTotal()),
  );

  // Reconciliación del pago dividido.
  protected readonly paidCents = computed(() =>
    this.splitRows().reduce((sum, row) => sum + toCents(row.amount ?? 0), 0),
  );
  protected readonly pendingCents = computed(() => this.totalCents() - this.paidCents());
  protected readonly paid = computed(() => this.paidCents() / 100);
  protected readonly pending = computed(() => this.pendingCents() / 100);

  protected readonly canConfirm = computed(() => {
    if (this.processing() || this.grandTotal() <= 0) {
      return false;
    }
    if (this.split()) {
      const rows = this.splitRows();
      return (
        rows.length > 0 && rows.every((row) => (row.amount ?? 0) > 0) && this.pendingCents() === 0
      );
    }
    if (this.method() === PaymentMethod.Cash) {
      return (this.amountReceived() ?? 0) >= this.grandTotal();
    }
    return true;
  });

  constructor() {
    // Reinicia el estado cada vez que se abre el modal.
    effect(() => {
      if (this.open()) {
        this.reset();
      }
    });
  }

  protected selectMethod(method: PaymentMethod): void {
    this.method.set(method);
  }

  protected onReceived(value: string): void {
    this.amountReceived.set(value ? Number(value) : null);
  }

  protected setQuick(amount: number): void {
    this.amountReceived.set(amount);
  }

  protected toggleSplit(): void {
    const next = !this.split();
    this.split.set(next);
    this.splitRows.set(next ? [{ method: PaymentMethod.Cash, amount: null }] : []);
  }

  protected addSplitRow(): void {
    this.splitRows.update((rows) => [...rows, { method: PaymentMethod.Cash, amount: null }]);
  }

  protected removeSplitRow(index: number): void {
    this.splitRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected setSplitMethod(index: number, method: number): void {
    this.splitRows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, method: method as PaymentMethod } : row)),
    );
  }

  protected setSplitAmount(index: number, value: string): void {
    const amount = value ? Number(value) : null;
    this.splitRows.update((rows) => rows.map((row, i) => (i === index ? { ...row, amount } : row)));
  }

  protected confirm(): void {
    if (!this.canConfirm()) {
      return;
    }

    const payments: SalePaymentRequest[] = this.split()
      ? this.splitRows().map((row) => ({ method: row.method, amount: row.amount ?? 0 }))
      : [{ method: this.method(), amount: this.grandTotal() }];

    const amountReceived = this.split()
      ? this.splitRows()
          .filter((row) => row.method === PaymentMethod.Cash)
          .reduce((sum, row) => sum + (row.amount ?? 0), 0)
      : this.method() === PaymentMethod.Cash
        ? (this.amountReceived() ?? 0)
        : this.grandTotal();

    // Venta en espera: solo se aportan los pagos (el carrito ya quedó fijado). Venta
    // nueva: se envía el carrito completo.
    const resumeId = this.resumeSaleId();
    const request$ = resumeId
      ? this.salesService.resumeSale(resumeId, { amountReceived, payments })
      : this.salesService.createSale({
          customerId: this.customer()?.id ?? null,
          amountReceived,
          payments,
          details: this.lines().map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        });

    this.processing.set(true);
    this.error.set(null);

    request$.subscribe({
      next: (sale) => {
        this.processing.set(false);
        this.sale.set(sale);
        this.emailInput.set(this.customer()?.email ?? '');
        this.stage.set('done');
        this.loadReceipt(sale.id);
      },
      error: (err) => {
        this.processing.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  protected print(): void {
    const receipt = this.receipt();
    if (!receipt) {
      return;
    }
    const error = printReceipt(receipt);
    if (error) {
      this.error.set(error);
    }
  }

  protected sendEmail(): void {
    const sale = this.sale();
    if (!sale) {
      return;
    }
    const email = this.emailInput().trim();
    this.emailSending.set(true);
    this.emailError.set(null);
    this.emailSent.set(false);

    this.salesService.emailReceipt(sale.id, email ? { email } : {}).subscribe({
      next: () => {
        this.emailSending.set(false);
        this.emailSent.set(true);
      },
      error: (err) => {
        this.emailSending.set(false);
        this.emailError.set(extractApiError(err).message);
      },
    });
  }

  // Botón "Nueva venta": finaliza el flujo y avisa al contenedor para limpiar el carrito.
  protected newSale(): void {
    const sale = this.sale();
    this.open.set(false);
    if (sale) {
      this.confirmed.emit(sale);
    }
  }

  protected cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }

  // El modal base se cerró (backdrop/ESC): si ya se cobró, finaliza; si no, cancela.
  protected handleClose(): void {
    const sale = this.sale();
    if (this.stage() === 'done' && sale) {
      this.confirmed.emit(sale);
    } else {
      this.cancelled.emit();
    }
  }

  private loadReceipt(id: number): void {
    this.salesService.getReceipt(id).subscribe({
      next: (receipt) => this.receipt.set(receipt),
      error: () => this.receipt.set(null),
    });
  }

  private reset(): void {
    this.stage.set('pay');
    this.method.set(PaymentMethod.Cash);
    this.amountReceived.set(null);
    this.split.set(false);
    this.splitRows.set([]);
    this.processing.set(false);
    this.error.set(null);
    this.sale.set(null);
    this.receipt.set(null);
    this.emailInput.set('');
    this.emailSending.set(false);
    this.emailSent.set(false);
    this.emailError.set(null);
  }
}
