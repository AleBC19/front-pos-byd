// Código de permiso del catálogo del API (p. ej. "administrar_usuarios").
// El API los entrega en User.permissions al iniciar sesión.
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

// Cuerpo de POST /api/auth/login-pin
export interface LoginPinRequest {
  username: string;
  pin: string;
}

// Usuario recordado en este equipo (pos.knownUsers) para el acceso rápido por PIN.
export interface KnownUser {
  username: string;
  fullName: string;
  role: string;
}

// Respuesta del API: POST /api/auth/login
export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  userId: number;
  username: string;
  fullName: string;
  role: string;
  // Códigos de permiso del usuario (catálogo Permissions del API).
  permissions: string[];
}

// Sesión persistida en localStorage (pos.session)
export interface Session {
  token: string;
  expiresAtUtc: string;
  user: User;
}

// ---------------------------------------------------------------------------
// Administración de usuarios (/api/users). El JSON viaja en camelCase.
// ---------------------------------------------------------------------------

export interface UserDto {
  id: number;
  username: string;
  firstName: string;
  secondName: string | null;
  lastName: string;
  rolId: number;
  rolName: string;
  isActive: boolean;
}

export interface CreateUserRequest {
  username: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  password: string;
  pin: string;
  rolId: number;
}

export interface UpdateUserRequest {
  username: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  // Opcionales en edición: solo se actualizan si se envían con valor.
  password?: string;
  pin?: string;
  rolId: number;
  isActive: boolean;
}

export const USER_PAGE_SIZES = [10, 20, 50] as const;
