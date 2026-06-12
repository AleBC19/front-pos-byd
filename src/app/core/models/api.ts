import { HttpErrorResponse } from '@angular/common/http';

// Sobre de error estándar del API (400/401/500).
export interface ApiError {
  message: string;
  details: string[];
}

// Sobre de paginación estándar del API (PagedResponse<T> del backend).
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type QueryParams = Record<string, string | number | boolean>;

// Normaliza cualquier error HTTP al sobre estándar del API,
// con mensaje de respaldo para errores de red o respuestas sin cuerpo.
export function extractApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as Partial<ApiError> | null;
    if (body && typeof body.message === 'string') {
      return { message: body.message, details: Array.isArray(body.details) ? body.details : [] };
    }
  }

  return { message: 'No se pudo conectar con el servidor. Intente de nuevo.', details: [] };
}
