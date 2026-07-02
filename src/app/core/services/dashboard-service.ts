import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardOverviewDto, DashboardOverviewQuery } from '../models/dashboard';
import { buildParams } from './products-service';

// Resumen del dashboard contra /api/dashboard/overview. Servicio sin estado:
// los componentes guardan los resultados en sus propias signals.
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard`;

  // KPIs + gráficas (ventas por día, por método de pago y por categoría).
  getOverview(query: DashboardOverviewQuery = {}): Observable<DashboardOverviewDto> {
    return this.http.get<DashboardOverviewDto>(`${this.baseUrl}/overview`, {
      params: buildParams(query),
    });
  }
}
