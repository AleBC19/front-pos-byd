// Tipos y utilidades locales del punto de venta (no son contratos del API).

// Renglón del ticket en construcción. Estado local del POS.
export interface CartItem {
  productId: number;
  code: string;
  name: string;
  // Decimales en pesos; snapshot de ProductDto.salePrice al agregar la línea.
  unitPrice: number;
  // Entero >= 1, topado al stock disponible.
  quantity: number;
  // Stock disponible al agregar (para topar la cantidad sin reconsultar el API).
  stock: number;
}

// IVA fijo del backend (16%). Si el backend lo vuelve configurable, ajustar aquí.
const TAX_PERCENT = 16;

// Pesos (decimal) → centavos (entero), replicando MidpointRounding.AwayFromZero del backend.
export function toCents(pesos: number): number {
  return Math.sign(pesos) * Math.floor(Math.abs(pesos) * 100 + 0.5);
}

// Totales en centavos, réplica EXACTA de Sale.RecalculateTotals del backend:
// IVA sobre el subtotal agregado, redondeo AwayFromZero. Trabajar en enteros evita
// desajustes de un centavo que el backend rechazaría con 409 al cobrar.
export function computeTotals(items: CartItem[]): {
  subtotalCents: number;
  taxesCents: number;
  totalCents: number;
} {
  const subtotalCents = items.reduce(
    (sum, item) => sum + toCents(item.unitPrice) * item.quantity,
    0,
  );
  const taxTimes = subtotalCents * TAX_PERCENT;
  const taxesCents = Math.floor(taxTimes / 100) + (taxTimes % 100 >= 50 ? 1 : 0);
  return { subtotalCents, taxesCents, totalCents: subtotalCents + taxesCents };
}
