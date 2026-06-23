// Datos de muestra estáticos para las tabs "Roles y permisos" y "Accesos recientes",
// que aún no tienen endpoint en el API. La tab "Usuarios" ya consume /api/users.

export interface RolePermission {
  // Path SVG (heroicons outline) del ícono del permiso.
  icon: string;
  name: string;
  description: string;
  enabled: boolean;
}

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

// Roles para el selector de la tab "Roles y permisos" (estática).
export const ROLES = ['Administrador', 'Gerente', 'Vendedor', 'Cajero'] as const;

// Permisos del sistema; el toggle refleja si el rol seleccionado los tiene.
export const ROLE_PERMISSIONS: RolePermission[] = [
  {
    name: 'Realizar ventas',
    description: 'Permite crear y procesar ventas en el punto de venta.',
    enabled: true,
    icon: 'M2.25 3h1.4a1.1 1.1 0 0 1 1.06.8L5.4 6m0 0 1.8 6.6a1.1 1.1 0 0 0 1.06.8h8.94a1.1 1.1 0 0 0 1.04-.74L20.6 6.7A.55.55 0 0 0 20.08 6H5.4Zm2.1 13.5a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Zm10.5 0a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Z',
  },
  {
    name: 'Aplicar descuentos',
    description: 'Permite aplicar descuentos y promociones a las ventas.',
    enabled: true,
    icon: 'M9 14.25 14.25 9M9.75 9.75h.008v.008H9.75V9.75Zm4.5 4.5h.008v.008h-.008v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    name: 'Procesar devoluciones',
    description: 'Permite procesar devoluciones y reembolsos.',
    enabled: false,
    icon: 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
  },
  {
    name: 'Ver reportes',
    description: 'Permite ver reportes e información del negocio.',
    enabled: true,
    icon: 'M9 17.25v-6m3.75 6V7.5m3.75 9.75v-3M4.88 20.25h14.24a1.13 1.13 0 0 0 1.13-1.13V4.88a1.13 1.13 0 0 0-1.13-1.13H4.88a1.13 1.13 0 0 0-1.13 1.13v14.24c0 .62.5 1.13 1.13 1.13Z',
  },
  {
    name: 'Administrar productos',
    description: 'Permite crear, editar y eliminar productos.',
    enabled: false,
    icon: 'm21 7.5-9-4.5-9 4.5m18 0-9 4.5m9-4.5v9l-9 4.5m0-9L3 7.5m9 4.5v9m-9-13.5v9l9 4.5',
  },
  {
    name: 'Administrar inventario',
    description: 'Permite ajustar inventario y movimientos.',
    enabled: false,
    icon: 'M3.75 8.25h16.5M4.5 8.25a1.5 1.5 0 0 1 0-3h15a1.5 1.5 0 0 1 0 3m-15 0V18a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 18V8.25',
  },
  {
    name: 'Administrar usuarios',
    description: 'Permite crear y administrar usuarios del sistema.',
    enabled: false,
    icon: 'M15 19.13v-1.5a4.13 4.13 0 0 0-4.12-4.13H5.63A4.13 4.13 0 0 0 1.5 17.63v1.5M18 8.25v6m3-3h-6m-4.5-3.38a3.38 3.38 0 1 1-6.75 0 3.38 3.38 0 0 1 6.75 0Z',
  },
  {
    name: 'Configurar sistema',
    description: 'Permite modificar la configuración del sistema.',
    enabled: false,
    icon: 'M10.34 4.07c.15-.9.93-1.57 1.85-1.57.92 0 1.7.66 1.85 1.57l.09.55a1.7 1.7 0 0 0 2.45 1.21l.5-.26a1.88 1.88 0 0 1 2.42.69c.46.79.3 1.8-.38 2.4l-.42.37a1.7 1.7 0 0 0 0 2.56l.42.37c.68.6.84 1.61.38 2.4a1.88 1.88 0 0 1-2.42.69l-.5-.26a1.7 1.7 0 0 0-2.45 1.21l-.09.55c-.15.9-.93 1.57-1.85 1.57-.92 0-1.7-.66-1.85-1.57l-.09-.55a1.7 1.7 0 0 0-2.45-1.21l-.5.26a1.88 1.88 0 0 1-2.42-.69 1.88 1.88 0 0 1 .38-2.4l.42-.37a1.7 1.7 0 0 0 0-2.56l-.42-.37a1.88 1.88 0 0 1-.38-2.4 1.88 1.88 0 0 1 2.42-.69l.5.26a1.7 1.7 0 0 0 2.45-1.21l.09-.55ZM15 12.2a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z',
  },
];

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
