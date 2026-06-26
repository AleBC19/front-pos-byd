import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CashRegisterSessionDto,
  CashSessionSummaryDto,
  CloseSessionRequest,
  OpenSessionRequest,
} from '../models/cash-register';
import { buildParams } from './products-service';

// Operaciones de caja contra /api/cash-register. Servicio sin estado:
// los componentes guardan los resultados en sus propias signals.
@Injectable({ providedIn: 'root' })
export class CashRegisterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/cash-register`;

  // Historial de turnos. El backend devuelve la lista completa (sin paginar).
  getSessions(): Observable<CashRegisterSessionDto[]> {
    return this.http.get<CashRegisterSessionDto[]>(`${this.baseUrl}/sessions`);
  }

  // Resumen/corte de un turno. declared permite recalcular la diferencia en vivo.
  getSummary(id: number, declared?: number): Observable<CashSessionSummaryDto> {
    return this.http.get<CashSessionSummaryDto>(`${this.baseUrl}/sessions/${id}/summary`, {
      params: buildParams(declared === undefined ? {} : { declared }),
    });
  }

  // Turno abierto actual; el backend responde 204 (cuerpo vacío) si no hay ninguno.
  getCurrent(): Observable<CashRegisterSessionDto | null> {
    return this.http.get<CashRegisterSessionDto | null>(`${this.baseUrl}/sessions/current`);
  }

  // Abre un nuevo turno. Falla (409) si ya hay uno abierto. Requiere permiso abrir_caja.
  openSession(body: OpenSessionRequest): Observable<CashRegisterSessionDto> {
    return this.http.post<CashRegisterSessionDto>(`${this.baseUrl}/sessions`, body);
  }

  // Cierra el turno y devuelve el corte. Requiere permiso cerrar_caja.
  closeSession(id: number, body: CloseSessionRequest): Observable<CashSessionSummaryDto> {
    return this.http.post<CashSessionSummaryDto>(`${this.baseUrl}/sessions/${id}/close`, body);
  }
}
