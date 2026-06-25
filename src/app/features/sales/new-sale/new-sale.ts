import { Component, computed, signal } from '@angular/core';
import { CustomerDto } from '../../../core/models/customer';
import { ProductDto } from '../../../core/models/product';
import { SaleDto } from '../../../core/models/sale';
import { CartItem, computeTotals } from '../cart-item';
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
  imports: [ProductCatalog, SaleTicket, PaymentModal],
})
export class NewSale {
  protected readonly items = signal<CartItem[]>([]);
  protected readonly customer = signal<CustomerDto | null>(null);
  protected readonly paymentOpen = signal(false);

  private readonly totals = computed(() => computeTotals(this.items()));
  protected readonly subtotal = computed(() => this.totals().subtotalCents / 100);
  protected readonly taxes = computed(() => this.totals().taxesCents / 100);
  protected readonly total = computed(() => this.totals().totalCents / 100);
  protected readonly canCheckout = computed(() => this.items().length > 0);

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
      this.paymentOpen.set(true);
    }
  }

  // Venta registrada: limpia el ticket para iniciar una nueva.
  protected onSaleConfirmed(_sale: SaleDto): void {
    this.items.set([]);
    this.customer.set(null);
    this.paymentOpen.set(false);
  }
}
