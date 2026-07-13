// Contratos de productos del API (/api/products).
// Los precios viajan como decimales en pesos; el backend los convierte a centavos.

export interface ProductDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  // URL relativa de la imagen (/media/products/...), o null si no tiene.
  imageUrl: string | null;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  minimumStock: number;
  isActive: boolean;
  categoryId: number;
}

// Cuerpo de POST/PUT /api/products. El stock no se envía:
// se gestiona por movimientos de inventario en el backend.
export interface SaveProductRequest {
  code: string;
  name: string;
  description?: string;
  // El PUT persiste imageUrl directo: al editar se reenvía el valor actual
  // para no borrar la imagen. La subida/borrado real usa los endpoints /image.
  imageUrl?: string | null;
  salePrice: number;
  purchasePrice: number;
  minimumStock: number;
  categoryId: number;
}

// Filtros de GET /api/products.
export interface ProductListQuery {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

// Tamaños de página que acepta el backend (cualquier otro valor responde 400).
export const PRODUCT_PAGE_SIZES = [20, 50, 60] as const;
