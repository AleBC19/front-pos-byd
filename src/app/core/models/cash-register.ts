// Contratos de caja del API (/api/cash-register).
// Un turno (CashRegisterSession) representa la sesión de caja: se abre con un fondo
// inicial y se cierra haciendo el corte. Los importes viajan como decimales en pesos;
// el backend los guarda en centavos. Los enums viajan como ENTEROS.

import { PaymentMethod } from './sale';

// Tipo de movimiento de caja registrado durante el turno.
export enum CashMovementType {
  Deposit = 1,
  Withdrawal = 2,
  Expense = 3,
}

// --- Respuestas ---

// Fila del historial de turnos (GET /api/cash-register/sessions).
// El listado no trae el nombre del cajero; se muestra a partir de userId.
export interface CashRegisterSessionDto {
  id: number;
  userId: number;
  openedAt: string;
  closedAt: string | null;
  openingFund: number;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalTransfer: number;
  declaredAmount: number;
  difference: number;
  openingNotes: string | null;
  closingNotes: string | null;
  isClosed: boolean;
}

// Total vendido por método de pago dentro de un turno.
export interface PaymentMethodTotalDto {
  method: PaymentMethod;
  total: number;
}

// Resumen/corte de un turno (GET /api/cash-register/sessions/{id}/summary).
// Para turnos abiertos el backend lo calcula en vivo; para cerrados usa el snapshot.
export interface CashSessionSummaryDto {
  id: number;
  userId: number;
  cashier: string;
  openedAt: string;
  closedAt: string | null;
  openingFund: number;
  salesByPaymentMethod: PaymentMethodTotalDto[];
  totalSales: number;
  ticketCount: number;
  totalDiscounts: number;
  totalReturns: number;
  returnsCount: number;
  netSales: number;
  deposits: number;
  withdrawals: number;
  expenses: number;
  expectedCash: number;
  declaredAmount: number;
  difference: number;
  openingNotes: string | null;
  closingNotes: string | null;
  isClosed: boolean;
}

// Movimiento de caja (depósito/retiro/gasto) registrado en un turno.
export interface CashMovementDto {
  id: number;
  sessionId: number;
  type: CashMovementType;
  amount: number;
  reason: string;
  userId: number;
  createdAt: string;
}

// --- Peticiones ---

// Cuerpo de POST /api/cash-register/sessions (abrir turno). Falla si ya hay un turno
// abierto (solo se permite uno a la vez). openingFund es el fondo inicial en pesos.
export interface OpenSessionRequest {
  openingFund: number;
  notes?: string;
}

// Cuerpo de POST /api/cash-register/sessions/{id}/close (cerrar turno / hacer corte).
// declaredAmount es el efectivo contado en pesos; la diferencia = contado - esperado.
export interface CloseSessionRequest {
  declaredAmount: number;
  notes?: string;
}

// --- UI ---

// Etiqueta del estado del turno para los badges del historial.
export function sessionStatusLabel(isClosed: boolean): string {
  return isClosed ? 'Cerrado' : 'Abierto';
}

// Traducción del tipo de movimiento de caja para la UI.
export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  [CashMovementType.Deposit]: 'Depósito',
  [CashMovementType.Withdrawal]: 'Retiro',
  [CashMovementType.Expense]: 'Gasto',
};
