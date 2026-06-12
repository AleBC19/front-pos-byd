import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/api';
import { ProductDto, ProductListQuery, SaveProductRequest } from '../models/product';

// CRUD de productos contra /api/products. Servicio sin estado:
// los componentes guardan los resultados en sus propias signals.
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/products`;

  getProducts(query: ProductListQuery = {}): Observable<PagedResponse<ProductDto>> {
    return this.http.get<PagedResponse<ProductDto>>(this.baseUrl, {
      params: buildParams(query),
    });
  }

  getProduct(id: number): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.baseUrl}/${id}`);
  }

  createProduct(body: SaveProductRequest): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.baseUrl, body);
  }

  updateProduct(id: number, body: SaveProductRequest): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.baseUrl}/${id}`, body);
  }

  // Borrado suave: el backend marca el producto como inactivo.
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Reactiva un producto desactivado.
  activateProduct(id: number): Observable<ProductDto> {
    return this.http.patch<ProductDto>(`${this.baseUrl}/${id}/activate`, {});
  }
}

// Convierte el query en HttpParams omitiendo valores vacíos o indefinidos.
export function buildParams(query: object): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params = params.set(key, value);
    }
  }

  return params;
}
