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

export interface UserRoleOption {
  id: number;
  name: string;
}

// El API no expone un endpoint de roles; estos son los roles sembrados
// (DataSeeder). Reemplazar por carga dinámica si más adelante existe el endpoint.
export const USER_ROLES: UserRoleOption[] = [
  { id: 1, name: 'Administrador' },
  { id: 2, name: 'Vendedor' },
];

export const USER_PAGE_SIZES = [10, 20, 50] as const;
