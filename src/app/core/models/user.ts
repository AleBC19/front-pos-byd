// TODO: definir permisos y modelo de usuario
export type Permission = string;

export interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  permissions: Permission[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
