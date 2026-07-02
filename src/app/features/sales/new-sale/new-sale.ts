import { Component, computed, inject, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { CustomerDto } from '../../../core/models/customer';
import { ProductDto } from '../../../core/models/product';
import { SaleDto, SaleStatus } from '../../../core/models/sale';
import { CashRegisterService } from '../../../core/services/cash-register-service';
import { SalesService } from '../../../core/services/sales-service';
import { CartItem, computeTotals } from '../cart-item';
import { HeldSalesPanel } from '../held-sales/held-sales-panel';
import { PaymentModal } from '../payment-modal/payment-modal';
import { ProductCatalog } from '../product-catalog/product-catalog';
import { SaleTicket } from '../sale-ticket/sale-ticket';

// Punto de venta (mockup venta-view): contenedor dueño del carrito y de los totales.
// El catálogo emite "agregar"; el ticket emite intenciones; el modal de cobro registra
// la venta. Los totales se calculan en centavos igual que el backend.
@Component({
  selector: 'app-new-sale',
  templateUrl: './new-sale.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  imports: [ProductCatalog, SaleTicket, PaymentModal, HeldSalesPanel],
})
export class NewSale {
  private readonly salesService = inject(SalesService);
  private readonly cashRegister = inject(CashRegisterService);

  protected readonly items = signal<CartItem[]>([]);
  protected readonly customer = signal<CustomerDto | null>(null);
  protected readonly paymentOpen = signal(false);

  // Estado de "dejar en espera".
  protected readonly holding = signal(false);
  protected readonly holdError = signal<string | null>(null);

  // Panel de ventas en espera y su contador (badge).
  protected readonly heldPanelOpen = signal(false);
  protected readonly heldCount = signal(0);
  protected readonly heldRefresh = signal(0);

  // Cobro de una venta en espera (modo reanudar): líneas fijadas + id de la venta.
  protected readonly resumeSaleId = signal<number | null>(null);
  protected readonly resumeLines = signal<CartItem[]>([]);

  // Líneas y cliente que recibe el modal de cobro: las de la venta en espera al
  // reanudar, o el carrito actual en una venta nueva.
  protected readonly paymentLines = computed(() =>
    this.resumeSaleId() ? this.resumeLines() : this.items(),
  );
  protected readonly paymentCustomer = computed(() =>
    this.resumeSaleId() ? null : this.customer(),
  );

  private readonly totals = computed(() => computeTotals(this.items()));
  protected readonly subtotal = computed(() => this.totals().subtotalCents / 100);
  protected readonly taxes = computed(() => this.totals().taxesCents / 100);
  protected readonly total = computed(() => this.totals().totalCents / 100);
  protected readonly canCheckout = computed(() => this.items().length > 0);

  constructor() {
    this.refreshHeldCount();
  }

  // Agrega un producto: si ya está en el ticket, incrementa (topado al stock).
  protected addProduct(product: ProductDto): void {
    this.items.update((items) => {
      const existing = items.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.stock) {
          return items;
        }
        return items.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      const item: CartItem = {
        productId: product.id,
        code: product.code,
        name: product.name,
        unitPrice: product.salePrice,
        quantity: 1,
        stock: product.stock,
      };
      return [...items, item];
    });
  }

  protected increment(productId: number): void {
    this.items.update((items) =>
      items.map((item) =>
        item.productId === productId && item.quantity < item.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  // Fija la cantidad tecleada por el usuario (clamp defensivo a [1, stock]).
  protected setQuantity({ productId, quantity }: { productId: number; quantity: number }): void {
    this.items.update((items) =>
      items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(Math.max(Math.floor(quantity), 1), item.stock) }
          : item,
      ),
    );
  }

  // Disminuye la cantidad; si llega a 0, elimina la línea.
  protected decrement(productId: number): void {
    this.items.update((items) =>
      items
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  protected remove(productId: number): void {
    this.items.update((items) => items.filter((item) => item.productId !== productId));
  }

  protected clearSale(): void {
    this.items.set([]);
    this.customer.set(null);
  }

  protected changeCustomer(customer: CustomerDto | null): void {
    this.customer.set(customer);
  }

  protected checkout(): void {
    if (this.canCheckout()) {
      // Venta nueva: asegura que el modal no esté en modo reanudar.
      this.resumeSaleId.set(null);
      this.resumeLines.set([]);
      this.paymentOpen.set(true);
    }
  }

  // Deja la venta actual en espera (sin cobrar): la guarda en el backend y limpia el ticket.
  protected hold(): void {
    if (!this.canCheckout() || this.holding()) {
      return;
    }
    this.holding.set(true);
    this.holdError.set(null);

    this.salesService
      .holdSale({
        customerId: this.customer()?.id ?? null,
        details: this.items().map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      })
      .subscribe({
        next: () => {
          this.holding.set(false);
          this.items.set([]);
          this.customer.set(null);
          this.heldRefresh.update((token) => token + 1);
          this.refreshHeldCount();
        },
        error: (err) => {
          this.holding.set(false);
          this.holdError.set(extractApiError(err).message);
        },
      });
  }

  protected openHeld(): void {
    this.heldPanelOpen.set(true);
  }

  // Cobrar una venta en espera: carga sus líneas y abre el modal en modo reanudar.
  protected onCharge(saleId: number): void {
    this.salesService.getSale(saleId).subscribe({
      next: (sale) => {
        this.resumeLines.set(
          sale.details.map((detail) => ({
            productId: detail.productId,
            code: '',
            name: detail.product,
            unitPrice: detail.unitPrice,
            quantity: detail.quantity,
            stock: detail.quantity,
          })),
        );
        this.resumeSaleId.set(sale.id);
        this.paymentOpen.set(true);
      },
      error: (err) => this.holdError.set(extractApiError(err).message),
    });
  }

  // Venta registrada o reanudada: limpia el estado para iniciar una nueva.
  protected onSaleConfirmed(_sale: SaleDto): void {
    this.items.set([]);
    this.customer.set(null);
    this.paymentOpen.set(false);
    this.resumeSaleId.set(null);
    this.resumeLines.set([]);
    this.refreshHeldCount();
    // Actualiza el corte del turno para reflejar la venta en el sidebar (no-op sin turno).
    this.cashRegister.refreshCurrentSummary();
  }

  // Una venta en espera fue descartada desde el panel: solo actualiza el contador
  // (no toca el ticket actual).
  protected onHeldChanged(): void {
    this.refreshHeldCount();
  }

  // Actualiza el contador del badge de ventas en espera.
  private refreshHeldCount(): void {
    this.salesService.getSales({ status: SaleStatus.Pending, pageSize: 20 }).subscribe({
      next: (response) => this.heldCount.set(response.totalCount),
      error: () => this.heldCount.set(0),
    });
  }
}
