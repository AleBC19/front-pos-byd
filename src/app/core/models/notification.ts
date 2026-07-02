// Notificación mostrada en el panel de la campana del topbar.
// (Aún sin backend: la lista se llena desde el cliente hasta que exista el endpoint.)
export interface AppNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string; // ISO
  read: boolean;
}
