// Datos dummy del login basados en el mockup public/mockups/login-view.png.
// TODO: reemplazar por datos reales del backend cuando exista el API.

export type ProfileRole = 'Vendedor' | 'Administrador';

export interface QuickProfile {
  id: string;
  name: string;
  role: ProfileRole;
  pin: string;
  online: boolean;
}

// Credenciales válidas dummy para la pestaña "Usuario y contraseña".
export const DUMMY_CREDENTIALS = {
  username: 'maria.gomez',
  password: '123456',
};

// Perfiles para el acceso rápido por PIN (columna derecha del mockup).
export const QUICK_PROFILES: QuickProfile[] = [
  { id: 'maria-gomez', name: 'María Gómez', role: 'Vendedor', pin: '1234', online: true },
  { id: 'carlos-martinez', name: 'Carlos Martínez', role: 'Administrador', pin: '1234', online: true },
  { id: 'ana-lopez', name: 'Ana López', role: 'Vendedor', pin: '1234', online: true },
  { id: 'luis-ramirez', name: 'Luis Ramírez', role: 'Vendedor', pin: '1234', online: true },
];

// Información de sesión mostrada en la barra superior (dummy, sin backend).
export const LOGIN_SESSION_INFO = {
  registerName: 'Caja 01',
  registerStatus: 'Abierta',
  date: '29/05/2025',
  time: '10:24 a.m.',
};

// Longitud del PIN para el acceso rápido.
export const PIN_LENGTH = 4;

// Paleta para los avatares de iniciales (se elige por índice del nombre).
const AVATAR_COLORS = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f97316', '#22c55e', '#0ea5e9'];

// Iniciales (máx. 2) a partir del nombre completo.
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

// Color de fondo estable derivado del nombre.
export function getAvatarColor(name: string): string {
  const sum = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
