import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { CustomerDto } from '../../../core/models/customer';
import {
  CreateSaleRequest,
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

// Escapa texto que se inyecta en la ventana de impresión del recibo.
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

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

    const body: CreateSaleRequest = {
      customerId: this.customer()?.id ?? null,
      amountReceived,
      payments,
      details: this.lines().map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    this.processing.set(true);
    this.error.set(null);

    this.salesService.createSale(body).subscribe({
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
    const win = window.open('', '_blank', 'width=380,height=640');
    if (!win) {
      this.error.set(
        'No se pudo abrir la ventana de impresión. Revise el bloqueador de ventanas emergentes.',
      );
      return;
    }
    win.document.write(this.buildReceiptHtml(receipt));
    win.document.close();
    win.focus();
    win.print();
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

  private buildReceiptHtml(receipt: ReceiptDto): string {
    const money = (value: number) => '$' + value.toFixed(2);
    const lines = receipt.lines
      .map(
        (line) =>
          `<tr><td>${line.quantity}x ${escapeHtml(line.product)}</td>` +
          `<td style="text-align:right">${money(line.lineTotal)}</td></tr>`,
      )
      .join('');
    const payments = receipt.payments
      .map(
        (payment) =>
          `<tr><td>${escapeHtml(this.labels[payment.method])}</td>` +
          `<td style="text-align:right">${money(payment.amount)}</td></tr>`,
      )
      .join('');

    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(
      receipt.folio,
    )}</title><style>
      body{font-family:'Courier New',monospace;font-size:12px;width:300px;margin:0 auto;padding:8px;color:#000}
      h1{font-size:14px;text-align:center;margin:4px 0}
      p{margin:2px 0}
      .muted{color:#555;text-align:center}
      table{width:100%;border-collapse:collapse}
      hr{border:none;border-top:1px dashed #000;margin:6px 0}
      .row{display:flex;justify-content:space-between}
      .total{font-size:14px;font-weight:bold}
    </style></head><body>
      <h1>${escapeHtml(receipt.businessName)}</h1>
      ${receipt.address ? `<p class="muted">${escapeHtml(receipt.address)}</p>` : ''}
      ${receipt.phone ? `<p class="muted">Tel: ${escapeHtml(receipt.phone)}</p>` : ''}
      ${receipt.taxId ? `<p class="muted">RFC: ${escapeHtml(receipt.taxId)}</p>` : ''}
      <hr>
      <p>Folio: ${escapeHtml(receipt.folio)}</p>
      <p>Fecha: ${new Date(receipt.date).toLocaleString('es-MX')}</p>
      <p>Cajero: ${escapeHtml(receipt.cashier)}</p>
      <p>Cliente: ${escapeHtml(receipt.customerName)}</p>
      <hr>
      <table>${lines}</table>
      <hr>
      <div class="row"><span>Subtotal</span><span>${money(receipt.subtotal)}</span></div>
      <div class="row"><span>IVA</span><span>${money(receipt.taxes)}</span></div>
      <div class="row total"><span>TOTAL</span><span>${money(receipt.total)}</span></div>
      <hr>
      <table>${payments}</table>
      <div class="row"><span>Recibido</span><span>${money(receipt.amountReceived)}</span></div>
      <div class="row"><span>Cambio</span><span>${money(receipt.change)}</span></div>
      <hr>
      <p class="muted">¡Gracias por su compra!</p>
    </body></html>`;
  }
}
