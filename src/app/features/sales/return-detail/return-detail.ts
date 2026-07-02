import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { ReturnDto } from '../../../core/models/return';
import { ReturnsService } from '../../../core/services/returns-service';

// Panel derecho del historial de devoluciones: detalle de la devolución seleccionada.
// Carga GET /api/returns/{id} (el listado no trae los renglones) y los muestra.
@Component({
  selector: 'app-return-detail',
  templateUrl: './return-detail.html',
  imports: [CurrencyPipe, DatePipe],
})
export class ReturnDetail {
  private readonly returnsService = inject(ReturnsService);

  readonly returnId = input<number | null>(null);

  protected readonly return_ = signal<ReturnDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Carga el detalle cada vez que cambia la devolución seleccionada.
    effect(() => {
      const id = this.returnId();
      if (id) {
        this.load(id);
      } else {
        this.return_.set(null);
      }
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.returnsService.getReturn(id).subscribe({
      next: (ret) => {
        this.return_.set(ret);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }
}
