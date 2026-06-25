import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReturnRequest, ReturnDto } from '../models/return';

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

  // Devoluciones asociadas a una venta (el backend filtra por saleId).
  listBySale(saleId: number): Observable<ReturnDto[]> {
    return this.http.get<ReturnDto[]>(this.baseUrl, {
      params: new HttpParams().set('saleId', saleId),
    });
  }
}
