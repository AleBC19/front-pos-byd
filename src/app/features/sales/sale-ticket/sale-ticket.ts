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
  readonly remove = output<number>();
  readonly checkout = output<void>();
  readonly hold = output<void>();
  readonly clearSale = output<void>();
  readonly changeCustomer = output<CustomerDto | null>();
}
