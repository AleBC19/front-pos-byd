// Contratos de devoluciones del API (/api/returns).
// Los importes viajan como decimales en pesos. Requiere el permiso procesar_devoluciones.

// --- Peticiones ---

// Renglón a devolver dentro de CreateReturnRequest. quantity es entero > 0 y no puede
// exceder la cantidad vendida (menos lo ya devuelto), o el backend responde 409.
export interface CreateReturnDetailRequest {
  productId: number;
  quantity: number;
}

// Cuerpo de POST /api/returns. userId va en el body (el backend no lo toma del token).
export interface CreateReturnRequest {
  saleId: number;
  userId: number;
  reason: string;
  notes?: string | null;
  details: CreateReturnDetailRequest[];
}

// --- Respuestas ---

// Renglón de una devolución. lineTotal = quantity * unitPrice.
export interface ReturnDetailDto {
  productId: number;
  product: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Devolución completa (POST /api/returns, GET /api/returns/{id}).
export interface ReturnDto {
  id: number;
  saleId: number;
  saleFolio: string;
  userId: number;
  reason: string;
  notes: string | null;
  total: number;
  createdAt: string;
  details: ReturnDetailDto[];
}

// Renglón del listado GET /api/returns (resumen; sin los renglones de la devolución).
export interface ReturnListItemDto {
  id: number;
  saleId: number;
  saleFolio: string;
  userId: number;
  cashier: string;
  reason: string;
  total: number;
  createdAt: string;
  itemCount: number;
}

// Filtros de GET /api/returns. sortBy: 'total' ordena por importe; cualquier otro, por fecha.
export interface GetReturnsRequest {
  from?: string; // yyyy-MM-dd (DateOnly)
  to?: string; // yyyy-MM-dd (DateOnly, inclusivo)
  saleId?: number;
  userId?: number;
  sortBy?: string;
  desc?: boolean;
  page?: number;
  pageSize?: number;
}

// El backend usa 20 por defecto y rechaza tamaños > 200.
export const RETURN_PAGE_SIZES = [20, 50, 60] as const;
