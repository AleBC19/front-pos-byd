import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/api';
import { CustomerDto, GetCustomersRequest, SaveCustomerRequest } from '../models/customer';
import { buildParams } from './products-service';

// Clientes contra /api/customers. Servicio sin estado.
@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/customers`;

  getCustomers(query: GetCustomersRequest = {}): Observable<PagedResponse<CustomerDto>> {
    return this.http.get<PagedResponse<CustomerDto>>(this.baseUrl, {
      params: buildParams(query),
    });
  }

  getCustomer(id: number): Observable<CustomerDto> {
    return this.http.get<CustomerDto>(`${this.baseUrl}/${id}`);
  }

  createCustomer(body: SaveCustomerRequest): Observable<CustomerDto> {
    return this.http.post<CustomerDto>(this.baseUrl, body);
  }
}
