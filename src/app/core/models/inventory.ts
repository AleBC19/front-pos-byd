// Contratos de inventario del API (/api/inventory).
// Los precios viajan como decimales en pesos (el backend los guarda en centavos).

// Tipo de movimiento. En las peticiones se envía como entero;
// en las respuestas el backend lo devuelve como string (ver MovementTypeName).
export enum InventoryMovementType {
  In = 1,
  Out = 2,
  Adjustment = 3,
  Sale = 4,
  Return = 5,
}

// Estado de stock que calcula el backend.
export type InventoryStockStatus = 'InStock' | 'LowStock' | 'OutOfStock';

// Nombre del tipo tal como llega en las respuestas de movimientos.
export type MovementTypeName = 'In' | 'Out' | 'Adjustment' | 'Sale' | 'Return';

// GET /api/inventory/summary — alimenta las tarjetas KPI.
export interface InventorySummaryDto {
  totalValueCost: number;
  totalValueRetail: number;
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayMovementsCount: number;
}

// Fila de GET /api/inventory/status.
export interface InventoryItemDto {
  productId: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string | null;
  stock: number;
  minimumStock: number;
  status: InventoryStockStatus;
  unitCost: number;
  stockValueCost: number;
}

// Fila de GET /api/inventory/movements (kardex).
export interface InventoryMovementDto {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  type: MovementTypeName;
  quantity: number;
  // Cambio con signo: positivo para entradas/devoluciones, negativo para salidas/ventas.
  change: number;
  reason: string | null;
  userId: number;
  userName: string | null;
  createdAt: string;
}

// Respuesta de POST /api/inventory/movements.
export interface MovementResultDto {
  movementId: number;
  productId: number;
  previousStock: number;
  newStock: number;
  status: InventoryStockStatus;
}

// Cuerpo de POST /api/inventory/movements.
// En Adjustment, quantity es el stock final absoluto (conteo físico);
// en In/Out es la cantidad a mover. reason es obligatorio (máx. 200 caracteres).
export interface CreateInventoryMovementRequest {
  productId: number;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
}

// Filtros de GET /api/inventory/status.
export interface InventoryStatusQuery {
  search?: string;
  categoryId?: number;
  status?: InventoryStockStatus;
  page?: number;
  pageSize?: number;
}

// Filtros de GET /api/inventory/movements.
export interface MovementsQuery {
  productId?: number;
  type?: InventoryMovementType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// Tamaños de página que acepta el backend (cualquier otro valor responde 400).
export const INVENTORY_PAGE_SIZES = [20, 50, 60] as const;

// Tipos que se pueden crear manualmente desde el panel "Ajustar stock".
// Sale y Return los genera el sistema automáticamente.
export const MANUAL_MOVEMENT_TYPES = [
  { type: InventoryMovementType.In, label: 'Entrada' },
  { type: InventoryMovementType.Out, label: 'Salida' },
  { type: InventoryMovementType.Adjustment, label: 'Ajuste' },
] as const;

// Traducción del estado de stock para la UI.
export const STOCK_STATUS_LABELS: Record<InventoryStockStatus, string> = {
  InStock: 'En stock',
  LowStock: 'Bajo stock',
  OutOfStock: 'Agotado',
};

// Traducción del tipo de movimiento (respuesta en string) para la UI.
export const MOVEMENT_TYPE_LABELS: Record<MovementTypeName, string> = {
  In: 'Entrada',
  Out: 'Salida',
  Adjustment: 'Ajuste',
  Sale: 'Venta',
  Return: 'Devolución',
};

// Catálogo de motivos predefinidos por tipo de movimiento manual.
// El motivo elegido se concatena con el comentario opcional en el campo `reason`.
export const INVENTORY_REASONS: Record<number, string[]> = {
  [InventoryMovementType.In]: [
    'Compra / Reabastecimiento',
    'Devolución de proveedor',
    'Ajuste de conteo',
    'Traspaso entre almacenes',
  ],
  [InventoryMovementType.Out]: [
    'Merma / Caducidad',
    'Daño',
    'Uso interno',
    'Traspaso entre almacenes',
  ],
  [InventoryMovementType.Adjustment]: [
    'Conteo físico',
    'Corrección de error',
  ],
};
