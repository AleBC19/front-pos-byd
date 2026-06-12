// TODO: definir permisos cuando el API los exponga
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
}

// Sesión persistida en localStorage (pos.session)
export interface Session {
  token: string;
  expiresAtUtc: string;
  user: User;
}
