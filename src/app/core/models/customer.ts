// Contratos de clientes del API (/api/customers).

export interface CustomerDto {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  isActive: boolean;
}

// Cuerpo de POST /api/customers (alta rápida desde el punto de venta).
export interface SaveCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
}

// Filtros de GET /api/customers.
export interface GetCustomersRequest {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

// Tamaños de página que acepta el backend (cualquier otro valor responde 400).
export const CUSTOMER_PAGE_SIZES = [20, 50, 60] as const;
