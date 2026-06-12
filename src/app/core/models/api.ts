// Sobre de error estándar del API (400/401/500).
export interface ApiError {
  message: string;
  details: string[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type QueryParams = Record<string, string | number | boolean>;
