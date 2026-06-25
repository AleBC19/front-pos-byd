// Contratos de ventas del API (/api/sales).
// Los importes viajan como decimales en pesos; el backend los guarda en centavos.
// Los enums (PaymentMethod, SaleStatus) viajan como ENTEROS en peticiones y respuestas
// (el backend no usa conversor de enum a string para las ventas).

// Método de pago. Mixed lo asigna el backend cuando una venta combina varios métodos.
export enum PaymentMethod {
  Cash = 1,
  DebitCard = 2,
  CreditCard = 3,
  BankTransfer = 4,
  Mixed = 5,
}

// Estado de la venta. Las ventas se crean siempre como Paid.
export enum SaleStatus {
  Pending = 1,
  Paid = 2,
  Cancelled = 3,
}

// --- Respuestas ---

// Pago individual dentro de una venta.
export interface SalePaymentDto {
  method: PaymentMethod;
  amount: number;
}

// Renglón de una venta. lineTotal = quantity * unitPrice - discount.
export interface SaleDetailDto {
  productId: number;
  product: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

// Venta completa (POST /api/sales, GET /api/sales/{id}).
export interface SaleDto {
  id: number;
  folio: string;
  date: string;
  userId: number;
  cashier: string;
  customerId: number | null;
  customerName: string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  subtotal: number;
  totalDiscount: number;
  taxes: number;
  total: number;
  amountReceived: number;
  change: number;
  payments: SalePaymentDto[];
  details: SaleDetailDto[];
}

// Fila del listado de ventas (GET /api/sales).
export interface SaleListItemDto {
  id: number;
  folio: string;
  date: string;
  userId: number;
  cashier: string;
  customerId: number | null;
  customerName: string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  total: number;
}

// Renglón del recibo.
export interface ReceiptLineDto {
  product: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

// Recibo de una venta (GET /api/sales/{id}/receipt). Los datos del negocio
// salen de la configuración del backend (sección Receipt) y pueden venir nulos.
export interface ReceiptDto {
  businessName: string;
  address: string | null;
  phone: string | null;
  taxId: string | null;
  folio: string;
  date: string;
  cashier: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  lines: ReceiptLineDto[];
  subtotal: number;
  totalDiscount: number;
  taxes: number;
  total: number;
  payments: SalePaymentDto[];
  amountReceived: number;
  change: number;
}

// --- Peticiones ---

// Pago dentro de CreateSaleRequest.
export interface SalePaymentRequest {
  method: PaymentMethod;
  amount: number;
}

// Renglón dentro de CreateSaleRequest. discount es opcional (0 por defecto);
// el POS no aplica descuentos por ahora (evita el permiso aplicar_descuentos).
export interface CreateSaleDetailRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

// Cuerpo de POST /api/sales. La suma de payments debe ser exactamente el total
// de la venta (subtotal + IVA), o el backend responde 409.
export interface CreateSaleRequest {
  customerId?: number | null;
  amountReceived: number;
  payments: SalePaymentRequest[];
  details: CreateSaleDetailRequest[];
}

// Cuerpo de POST /api/sales/{id}/email-receipt. Si se omite el email usa el del cliente.
export interface EmailReceiptRequest {
  email?: string;
}

// Filtros de GET /api/sales.
export interface GetSalesRequest {
  from?: string;
  to?: string;
  cashierId?: number;
  status?: SaleStatus;
  paymentMethod?: PaymentMethod;
  folio?: string;
  sortBy?: string;
  desc?: boolean;
  page?: number;
  pageSize?: number;
}

// Traducción del método de pago para la UI.
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.Cash]: 'Efectivo',
  [PaymentMethod.DebitCard]: 'Tarjeta de débito',
  [PaymentMethod.CreditCard]: 'Tarjeta de crédito',
  [PaymentMethod.BankTransfer]: 'Transferencia',
  [PaymentMethod.Mixed]: 'Pago mixto',
};

// Métodos que el usuario puede elegir al cobrar (Mixed lo deriva el backend).
export const SELECTABLE_PAYMENT_METHODS = [
  PaymentMethod.Cash,
  PaymentMethod.DebitCard,
  PaymentMethod.CreditCard,
  PaymentMethod.BankTransfer,
] as const;

// Importes rápidos de efectivo del modal de cobro.
export const QUICK_CASH_AMOUNTS = [50, 100, 200, 500] as const;

// Tamaños de página que acepta el backend (cualquier otro valor responde 400).
export const SALE_PAGE_SIZES = [20, 50, 60] as const;
