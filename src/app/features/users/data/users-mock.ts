// Datos de muestra estáticos para la tab "Accesos recientes", que aún no tiene
// endpoint en el API. Las tabs "Usuarios" y "Roles y permisos" ya consumen el
// API (/api/users, /api/roles, /api/permissions).

export interface RecentAccessRow {
  id: number;
  fullName: string;
  username: string;
  initials: string;
  avatarColor: string;
  dateTime: string;
  device: string;
  ip: string;
  success: boolean;
}

export const RECENT_ACCESS: RecentAccessRow[] = [
  {
    id: 1,
    fullName: 'Ana Torres',
    username: 'atorres',
    initials: 'AT',
    avatarColor: 'bg-rose-100 text-rose-700',
    dateTime: '23/05/2025 11:47 a. m.',
    device: 'Chrome · Windows',
    ip: '192.168.1.10',
    success: true,
  },
  {
    id: 2,
    fullName: 'Juan Pérez',
    username: 'jperez',
    initials: 'JP',
    avatarColor: 'bg-blue-100 text-blue-700',
    dateTime: '23/05/2025 10:32 a. m.',
    device: 'Chrome · Windows',
    ip: '192.168.1.24',
    success: true,
  },
  {
    id: 3,
    fullName: 'María Gómez',
    username: 'mgomez',
    initials: 'MG',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    dateTime: '23/05/2025 09:15 a. m.',
    device: 'Edge · Windows',
    ip: '192.168.1.31',
    success: true,
  },
  {
    id: 4,
    fullName: 'Roberto López',
    username: 'rlopez',
    initials: 'RL',
    avatarColor: 'bg-violet-100 text-violet-700',
    dateTime: '18/05/2025 04:51 p. m.',
    device: 'Chrome · Android',
    ip: '192.168.1.45',
    success: false,
  },
];
