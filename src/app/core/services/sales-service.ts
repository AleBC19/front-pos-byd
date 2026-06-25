import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/api';
import {
  CreateSaleRequest,
  EmailReceiptRequest,
  GetSalesRequest,
  ReceiptDto,
  SaleDto,
  SaleListItemDto,
} from '../models/sale';
import { buildParams } from './products-service';

// Operaciones de ventas contra /api/sales. Servicio sin estado:
// los componentes guardan los resultados en sus propias signals.
@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/sales`;

  // Registra una venta (queda en estado Paid). La suma de payments debe
  // coincidir exactamente con el total o el backend responde 409.
  createSale(body: CreateSaleRequest): Observable<SaleDto> {
    return this.http.post<SaleDto>(this.baseUrl, body);
  }

  getSales(query: GetSalesRequest = {}): Observable<PagedResponse<SaleListItemDto>> {
    return this.http.get<PagedResponse<SaleListItemDto>>(this.baseUrl, {
      params: buildParams(query),
    });
  }

  getSale(id: number): Observable<SaleDto> {
    return this.http.get<SaleDto>(`${this.baseUrl}/${id}`);
  }

  getReceipt(id: number): Observable<ReceiptDto> {
    return this.http.get<ReceiptDto>(`${this.baseUrl}/${id}/receipt`);
  }

  // Envía el recibo por correo. Si no se indica email, usa el del cliente de la venta.
  emailReceipt(id: number, body: EmailReceiptRequest = {}): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/email-receipt`, body);
  }

  // Cancela una venta: repone stock y la marca como cancelada (requiere permiso cancelar_ventas).
  cancelSale(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
