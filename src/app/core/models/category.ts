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
