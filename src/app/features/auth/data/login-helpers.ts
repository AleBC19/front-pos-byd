// Helpers y constantes de la pantalla de login.

// Información de sesión mostrada en la barra superior (dummy, sin backend).
// TODO: reemplazar cuando el API exponga la caja y la fecha/hora reales.
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
