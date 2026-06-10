// TODO: definir permisos y modelo de usuario
export type Permission = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Permission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
