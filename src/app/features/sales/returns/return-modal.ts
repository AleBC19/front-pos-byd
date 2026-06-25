import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { CreateReturnDetailRequest } from '../../../core/models/return';
import { SaleDto } from '../../../core/models/sale';
import { AuthService } from '../../../core/services/auth-service';
import { ReturnsService } from '../../../core/services/returns-service';
import { Modal } from '../../../shared/components/modal/modal';

// Renglón devolvible: cantidad a devolver (0..vendida) por producto de la venta.
interface ReturnLine {
  productId: number;
  product: string;
  sold: number;
  unitPrice: number;
  quantity: number;
}

// Modal "Procesar devolución" (mockup historial-ventas-view): se selecciona la cantidad a
// devolver por producto, un motivo (obligatorio) y notas. Repone stock vía POST /api/returns.
// Requiere el permiso procesar_devoluciones (el backend responde 403 si falta).
@Component({
  selector: 'app-return-modal',
  templateUrl: './return-modal.html',
  imports: [Modal, CurrencyPipe],
})
export class ReturnModal {
  private readonly returnsService = inject(ReturnsService);
  private readonly auth = inject(AuthService);

  readonly open = model(false);
  readonly sale = input<SaleDto | null>(null);

  readonly confirmed = output<void>();

  protected readonly lines = signal<ReturnLine[]>([]);
  protected readonly reason = signal('');
  protected readonly notes = signal('');
  protected readonly processing = signal(false);
  protected readonly error = signal<string | null>(null);

  // Total a reembolsar (suma de cantidad a devolver × precio unitario).
  protected readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
  );

  protected readonly canConfirm = computed(
    () =>
      !this.processing() &&
      this.reason().trim().length > 0 &&
      this.lines().some((line) => line.quantity > 0),
  );

  constructor() {
    // Reinicia el formulario con los renglones de la venta cada vez que se abre.
    effect(() => {
      if (this.open()) {
        this.reset();
      }
    });
  }

  protected setQuantity(productId: number, value: string): void {
    const sold = this.lines().find((line) => line.productId === productId)?.sold ?? 0;
    const quantity = Math.max(0, Math.min(sold, Math.floor(Number(value) || 0)));
    this.lines.update((lines) =>
      lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    );
  }

  protected confirm(): void {
    const sale = this.sale();
    if (!sale || !this.canConfirm()) {
      return;
    }

    const details: CreateReturnDetailRequest[] = this.lines()
      .filter((line) => line.quantity > 0)
      .map((line) => ({ productId: line.productId, quantity: line.quantity }));

    const notes = this.notes().trim();

    this.processing.set(true);
    this.error.set(null);

    this.returnsService
      .createReturn({
        saleId: sale.id,
        userId: Number(this.auth.currentUser()?.id) || 0,
        reason: this.reason().trim(),
        notes: notes || null,
        details,
      })
      .subscribe({
        next: () => {
          this.processing.set(false);
          this.open.set(false);
          this.confirmed.emit();
        },
        error: (err) => {
          this.processing.set(false);
          this.error.set(extractApiError(err).message);
        },
      });
  }

  private reset(): void {
    const sale = this.sale();
    this.lines.set(
      (sale?.details ?? []).map((detail) => ({
        productId: detail.productId,
        product: detail.product,
        sold: detail.quantity,
        unitPrice: detail.unitPrice,
        quantity: 0,
      })),
    );
    this.reason.set('');
    this.notes.set('');
    this.processing.set(false);
    this.error.set(null);
  }
}
