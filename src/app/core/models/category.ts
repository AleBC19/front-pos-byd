// Contratos de categorías de producto del API (/api/categories).

export interface CategoryDto {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface SaveCategoryRequest {
  name: string;
  description?: string;
}

export interface CategoryListQuery {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

// Tamaños de página que acepta el backend (cualquier otro valor responde 400).
export const CATEGORY_PAGE_SIZES = [20, 50, 60] as const;
