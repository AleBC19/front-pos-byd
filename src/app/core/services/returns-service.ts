import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/api';
import {
  CreateReturnRequest,
  GetReturnsRequest,
  ReturnDto,
  ReturnListItemDto,
} from '../models/return';
import { buildParams } from './products-service';

// Operaciones de devoluciones contra /api/returns. Servicio sin estado:
// los componentes guardan los resultados en sus propias signals.
// Todos los endpoints requieren el permiso procesar_devoluciones (403 si falta).
@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/returns`;

  // Registra una devolución: repone stock de los artículos devueltos.
  createReturn(body: CreateReturnRequest): Observable<ReturnDto> {
    return this.http.post<ReturnDto>(this.baseUrl, body);
  }

  getReturn(id: number): Observable<ReturnDto> {
    return this.http.get<ReturnDto>(`${this.baseUrl}/${id}`);
  }

  // Listado global de devoluciones con filtros (rango de fechas, venta, usuario) y paginación.
  getReturns(query: GetReturnsRequest = {}): Observable<PagedResponse<ReturnListItemDto>> {
    return this.http.get<PagedResponse<ReturnListItemDto>>(this.baseUrl, {
      params: buildParams(query),
    });
  }
}
