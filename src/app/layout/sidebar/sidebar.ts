import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../core/models/menu';
import { AuthService } from '../../core/services/auth-service';
import { CASH_REGISTER } from '../../features/dashboard/data/dashboard-mock';

// Navegación lateral con tarjeta de cierre de caja. El menú llega de la API en el login
// (ya filtrado por permisos) y se expone vía AuthService.menu().
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  imports: [RouterLink, RouterLinkActive],
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cashRegister = CASH_REGISTER;

  // Menú entregado por la API (árbol de 2 niveles; icon ya es un path SVG).
  protected readonly navItems = this.auth.menu;

  // Grupos expandidos del menú. Se abre el grupo cuya ruta coincide con la actual.
  protected readonly expanded = signal<Set<string>>(
    new Set(
      this.auth
        .menu()
        .filter(
          (item) =>
            item.children.length &&
            item.children.some((child) => child.route && this.router.url.startsWith(child.route)),
        )
        .map((item) => item.label),
    ),
  );

  // Clic en el grupo (p. ej. Ventas): navega a la primera subopción (Nueva venta)
  // y deja el grupo expandido. El chevron se usa para colapsar/expandir sin navegar.
  protected openGroup(item: MenuItem): void {
    const target = item.children[0]?.route;
    if (target) {
      this.router.navigate([target]);
    }
    this.expanded.update((current) => new Set(current).add(item.label));
  }

  protected toggle(label: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  protected isExpanded(label: string): boolean {
    return this.expanded().has(label);
  }

  // Cierra sesión contra el API; navega a /login aunque la petición falle
  // (la sesión local ya quedó limpia por el servicio).
  protected logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
