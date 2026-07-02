import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { CustomerDto } from '../../../core/models/customer';
import { CartItem } from '../cart-item';
import { CustomerSelector } from '../customer-selector/customer-selector';

// Panel derecho del POS (presentacional): muestra el ticket y emite intenciones.
// El contenedor (NewSale) es el dueño del carrito y de los totales.
@Component({
  selector: 'app-sale-ticket',
  templateUrl: './sale-ticket.html',
  imports: [CurrencyPipe, CustomerSelector],
})
export class SaleTicket {
  readonly items = input<CartItem[]>([]);
  readonly customer = input<CustomerDto | null>(null);
  readonly subtotal = input(0);
  readonly taxes = input(0);
  readonly total = input(0);
  readonly canCheckout = input(false);

  readonly increment = output<number>();
  readonly decrement = output<number>();
  readonly setQuantity = output<{ productId: number; quantity: number }>();
  readonly remove = output<number>();
  readonly checkout = output<void>();
  readonly hold = output<void>();
  readonly clearSale = output<void>();
  readonly changeCustomer = output<CustomerDto | null>();

  // Sanea la cantidad tecleada: entero, acotada a [1, stock]. Reescribe el valor del
  // input porque el binding es unidireccional: si tras el clamp la cantidad no cambia,
  // el DOM se quedaría mostrando lo que tecleó el usuario (p. ej. 99 con tope 5).
  protected onQuantityInput(item: CartItem, inputEl: HTMLInputElement): void {
    const parsed = Math.floor(Number(inputEl.value));
    const quantity = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), item.stock)
      : item.quantity;
    inputEl.value = String(quantity);
    this.setQuantity.emit({ productId: item.productId, quantity });
  }
}
