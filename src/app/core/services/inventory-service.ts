import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/api';
import { BelowMinimumProductDto } from '../models/dashboard';
import {
  CreateInventoryMovementRequest,
  InventoryItemDto,
  InventoryMovementDto,
  InventoryStatusQuery,
  InventorySummaryDto,
  MovementResultDto,
  MovementsQuery,
} from '../models/inventory';
import { buildParams } from './products-service';

// Inventario contra /api/inventory. Servicio sin estado:
// los componentes guardan los resultados en sus propias signals.
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/inventory`;

  // KPIs del encabezado (valor, bajo stock, agotados, movimientos de hoy).
  getSummary(): Observable<InventorySummaryDto> {
    return this.http.get<InventorySummaryDto>(`${this.baseUrl}/summary`);
  }

  // Estado de stock por producto, paginado.
  getStatus(query: InventoryStatusQuery = {}): Observable<PagedResponse<InventoryItemDto>> {
    return this.http.get<PagedResponse<InventoryItemDto>>(`${this.baseUrl}/status`, {
      params: buildParams(query),
    });
  }

  // Historial de movimientos (kardex), paginado.
  getMovements(query: MovementsQuery = {}): Observable<PagedResponse<InventoryMovementDto>> {
    return this.http.get<PagedResponse<InventoryMovementDto>>(`${this.baseUrl}/movements`, {
      params: buildParams(query),
    });
  }

  // Productos con stock por debajo (o igual) del mínimo, para alertas del dashboard.
  // Devuelve la entidad cruda: precios en centavos y sin nombre de categoría.
  getBelowMinimum(): Observable<BelowMinimumProductDto[]> {
    return this.http.get<BelowMinimumProductDto[]>(`${this.baseUrl}/below-minimum`);
  }

  // Registra un movimiento manual (entrada, salida o ajuste).
  // Requiere el permiso administrar_inventario.
  createMovement(body: CreateInventoryMovementRequest): Observable<MovementResultDto> {
    return this.http.post<MovementResultDto>(`${this.baseUrl}/movements`, body);
  }

  // Descarga el inventario como archivo xlsx.
  exportInventory(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
  }
}
