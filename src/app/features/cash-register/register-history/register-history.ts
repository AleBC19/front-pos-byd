import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { CashRegisterSessionDto } from '../../../core/models/cash-register';
import { CashRegisterService } from '../../../core/services/cash-register-service';
import { CashCutDetail } from '../cash-cut-detail/cash-cut-detail';

type StatusFilter = 'all' | 'open' | 'closed';

// Pantalla "Cierres" (sin mockup, basada en sale-history): historial de turnos a la
// izquierda y panel del corte del turno seleccionado a la derecha. El API devuelve la
// lista completa sin paginar, así que el filtrado por fecha/estado es del lado del cliente.
@Component({
  selector: 'app-register-history',
  templateUrl: './register-history.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  imports: [CashCutDetail, CurrencyPipe, DatePipe],
})
export class RegisterHistory {
  private readonly cashRegisterService = inject(CashRegisterService);

  // Filtros del lado del cliente.
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly status = signal<StatusFilter>('all');

  // Datos y estado de la petición.
  protected readonly sessions = signal<CashRegisterSessionDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Turno seleccionado para el panel de corte.
  protected readonly selectedId = signal<number | null>(null);

  // Aplica los filtros de fecha (sobre la apertura) y estado a la lista completa.
  protected readonly filtered = computed<CashRegisterSessionDto[]>(() => {
    const from = this.from();
    const to = this.to();
    const status = this.status();

    return this.sessions().filter((session) => {
      if (status === 'open' && session.isClosed) {
        return false;
      }
      if (status === 'closed' && !session.isClosed) {
        return false;
      }
      const openedDay = session.openedAt.slice(0, 10);
      if (from && openedDay < from) {
        return false;
      }
      if (to && openedDay > to) {
        return false;
      }
      return true;
    });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cashRegisterService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  protected onFromChange(value: string): void {
    this.from.set(value);
  }

  protected onToChange(value: string): void {
    this.to.set(value);
  }

  protected onStatusChange(value: string): void {
    this.status.set(value as StatusFilter);
  }

  protected clearFilters(): void {
    this.from.set('');
    this.to.set('');
    this.status.set('all');
  }

  protected select(id: number): void {
    this.selectedId.set(id);
  }
}
