import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CashRegisterSessionDto,
  CashSessionSummaryDto,
  CloseSessionRequest,
  OpenSessionRequest,
} from '../models/cash-register';
import { buildParams } from './products-service';

// Operaciones de caja contra /api/cash-register. Mantiene el turno abierto actual y su
// corte en vivo como signals compartidos (fuente única de verdad) para que topbar y
// sidebar reaccionen a la apertura/cierre y a las operaciones del turno.
@Injectable({ providedIn: 'root' })
export class CashRegisterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/cash-register`;

  // Turno abierto actual; null si no hay ninguno. Fuente única de verdad para el layout.
  private readonly currentSessionSignal = signal<CashRegisterSessionDto | null>(null);
  readonly currentSession = this.currentSessionSignal.asReadonly();

  // Corte en vivo del turno abierto; null si no hay turno o aún no se ha cargado.
  private readonly currentSummarySignal = signal<CashSessionSummaryDto | null>(null);
  readonly currentSummary = this.currentSummarySignal.asReadonly();

  // Historial de turnos. El backend devuelve la lista completa (sin paginar).
  getSessions(): Observable<CashRegisterSessionDto[]> {
    return this.http.get<CashRegisterSessionDto[]>(`${this.baseUrl}/sessions`);
  }

  // Resumen/corte de un turno. declared permite recalcular la diferencia en vivo.
  // Passthrough puro: se usa con ids arbitrarios (turnos históricos), así que NO toca
  // el estado compartido; el corte en vivo se actualiza vía refreshCurrentSummary().
  getSummary(id: number, declared?: number): Observable<CashSessionSummaryDto> {
    return this.http.get<CashSessionSummaryDto>(`${this.baseUrl}/sessions/${id}/summary`, {
      params: buildParams(declared === undefined ? {} : { declared }),
    });
  }

  // Turno abierto actual; el backend responde 204 (cuerpo vacío) si no hay ninguno.
  // Sincroniza el estado compartido: si no hay turno, también limpia el corte.
  getCurrent(): Observable<CashRegisterSessionDto | null> {
    return this.http.get<CashRegisterSessionDto | null>(`${this.baseUrl}/sessions/current`).pipe(
      tap((session) => {
        this.currentSessionSignal.set(session ?? null);
        if (!session) {
          this.currentSummarySignal.set(null);
        }
      }),
    );
  }

  // Abre un nuevo turno. Falla (409) si ya hay uno abierto. Requiere permiso abrir_caja.
  // Deja el turno como actual y carga su corte inicial.
  openSession(body: OpenSessionRequest): Observable<CashRegisterSessionDto> {
    return this.http.post<CashRegisterSessionDto>(`${this.baseUrl}/sessions`, body).pipe(
      tap((session) => {
        this.currentSessionSignal.set(session);
        this.refreshCurrentSummary();
      }),
    );
  }

  // Cierra el turno y devuelve el corte. Requiere permiso cerrar_caja.
  // Limpia el estado compartido (ya no hay turno abierto).
  closeSession(id: number, body: CloseSessionRequest): Observable<CashSessionSummaryDto> {
    return this.http.post<CashSessionSummaryDto>(`${this.baseUrl}/sessions/${id}/close`, body).pipe(
      tap(() => {
        this.currentSessionSignal.set(null);
        this.currentSummarySignal.set(null);
      }),
    );
  }

  // Refresca solo el corte del turno actual (1 llamada; no-op si no hay turno abierto).
  // Se llama tras cada operación que cambie las cifras (venta, movimiento, navegación).
  refreshCurrentSummary(): void {
    const session = this.currentSessionSignal();
    if (!session) {
      this.currentSummarySignal.set(null);
      return;
    }
    this.getSummary(session.id).subscribe({
      next: (summary) => this.currentSummarySignal.set(summary),
      error: () => {
        /* mantiene el último corte conocido para evitar parpadeo */
      },
    });
  }

  // Re-sincronía completa (carga inicial): consulta el turno actual y, si lo hay, su corte.
  refreshCurrent(): void {
    this.getCurrent().subscribe({
      next: (session) => {
        if (session) {
          this.refreshCurrentSummary();
        } else {
          this.currentSummarySignal.set(null);
        }
      },
      error: () => {
        /* deja el último estado conocido */
      },
    });
  }

  // Limpia el estado compartido (p. ej. al cerrar sesión: el servicio es singleton).
  reset(): void {
    this.currentSessionSignal.set(null);
    this.currentSummarySignal.set(null);
  }
}
