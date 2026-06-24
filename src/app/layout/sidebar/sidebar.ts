import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { CASH_REGISTER } from '../../features/dashboard/data/dashboard-mock';

interface NavItem {
  label: string;
  icon: string;
  route: string | null;
}

// Navegación lateral con tarjeta de cierre de caja.
// TODO: filtrar ítems por permisos y habilitar rutas conforme existan las vistas.
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  imports: [RouterLink, RouterLinkActive],
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cashRegister = CASH_REGISTER;

  // Cierra sesión contra el API; navega a /login aunque la petición falle
  // (la sesión local ya quedó limpia por el servicio).
  protected logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  // Paths SVG estilo heroicons (outline, viewBox 24). Solo Dashboard y Productos navegan por ahora.
  protected readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'M2.25 12 11.2 3a1.1 1.1 0 0 1 1.6 0l8.95 9M4.5 9.75V19.9a1.1 1.1 0 0 0 1.1 1.1H9.75v-4.9a1.1 1.1 0 0 1 1.1-1.1h2.3a1.1 1.1 0 0 1 1.1 1.1V21h4.15a1.1 1.1 0 0 0 1.1-1.1V9.75',
    },
    {
      label: 'Ventas',
      route: null,
      icon: 'M2.25 3h1.4a1.1 1.1 0 0 1 1.06.8L5.4 6m0 0 1.8 6.6a1.1 1.1 0 0 0 1.06.8h8.94a1.1 1.1 0 0 0 1.04-.74L20.6 6.7A.55.55 0 0 0 20.08 6H5.4Zm2.1 13.5a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Zm10.5 0a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Z',
    },
    {
      label: 'Productos',
      route: '/products',
      icon: 'm21 7.5-9-4.5-9 4.5m18 0-9 4.5m9-4.5v9l-9 4.5m0-9L3 7.5m9 4.5v9m-9-13.5v9l9 4.5',
    },
    {
      label: 'Categorías',
      route: '/categories',
      icon: 'M9.57 3H5.25A2.25 2.25 0 0 0 3 5.25v4.32c0 .6.24 1.17.66 1.59l8.69 8.69a2.25 2.25 0 0 0 3.18 0l4.32-4.32a2.25 2.25 0 0 0 0-3.18L11.16 3.66A2.25 2.25 0 0 0 9.57 3ZM6 6h.01',
    },
    {
      label: 'Inventario',
      route: '/inventory',
      icon: 'M3.75 8.25h16.5M4.5 8.25a1.5 1.5 0 0 1 0-3h15a1.5 1.5 0 0 1 0 3m-15 0V18a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 18V8.25m-9.75 4.5h4.5',
    },
    {
      label: 'Usuarios',
      route: '/users',
      icon: 'M15 19.13v-1.5a4.13 4.13 0 0 0-4.12-4.13H5.63A4.13 4.13 0 0 0 1.5 17.63v1.5M18 8.25v6m3-3h-6m-4.5-3.38a3.38 3.38 0 1 1-6.75 0 3.38 3.38 0 0 1 6.75 0Z',
    },
    {
      label: 'Reportes',
      route: null,
      icon: 'M9 17.25v-6m3.75 6V7.5m3.75 9.75v-3M4.88 20.25h14.24a1.13 1.13 0 0 0 1.13-1.13V4.88a1.13 1.13 0 0 0-1.13-1.13H4.88a1.13 1.13 0 0 0-1.13 1.13v14.24c0 .62.5 1.13 1.13 1.13Z',
    },
    {
      label: 'Configuración',
      route: null,
      icon: 'M10.34 4.07c.15-.9.93-1.57 1.85-1.57.92 0 1.7.66 1.85 1.57l.09.55a1.7 1.7 0 0 0 2.45 1.21l.5-.26a1.88 1.88 0 0 1 2.42.69c.46.79.3 1.8-.38 2.4l-.42.37a1.7 1.7 0 0 0 0 2.56l.42.37c.68.6.84 1.61.38 2.4a1.88 1.88 0 0 1-2.42.69l-.5-.26a1.7 1.7 0 0 0-2.45 1.21l-.09.55c-.15.9-.93 1.57-1.85 1.57-.92 0-1.7-.66-1.85-1.57l-.09-.55a1.7 1.7 0 0 0-2.45-1.21l-.5.26a1.88 1.88 0 0 1-2.42-.69 1.88 1.88 0 0 1 .38-2.4l.42-.37a1.7 1.7 0 0 0 0-2.56l-.42-.37a1.88 1.88 0 0 1-.38-2.4 1.88 1.88 0 0 1 2.42-.69l.5.26a1.7 1.7 0 0 0 2.45-1.21l.09-.55ZM15 12.2a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z',
    },
  ];
}
