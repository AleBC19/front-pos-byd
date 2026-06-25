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

// Devolución completa (POST /api/returns, GET /api/returns/{id}, GET /api/returns?saleId=).
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
