// TODO: definir tipos de respuesta de la API
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type QueryParams = Record<string, string | number | boolean>;
