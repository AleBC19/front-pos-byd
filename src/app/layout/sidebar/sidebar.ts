import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../../core/models/menu';
import { AuthService } from '../../core/services/auth-service';
import { CashRegisterService } from '../../core/services/cash-register-service';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';

// Navegación lateral con tarjeta de cierre de caja. El menú llega de la API en el login
// (ya filtrado por permisos) y se expone vía AuthService.menu(). La tarjeta de caja usa
// el estado compartido de CashRegisterService (la carga inicial la dispara el topbar).
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  imports: [RouterLink, RouterLinkActive, CurrencyPipe, DatePipe, ConfirmDialog],
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  private readonly cashRegister = inject(CashRegisterService);
  private readonly router = inject(Router);

  // Turno abierto actual y su corte en vivo (estado compartido del servicio de caja).
  protected readonly session = this.cashRegister.currentSession;
  protected readonly summary = this.cashRegister.currentSummary;

  // Menú entregado por la API. Configuración se agrega temporalmente desde el
  // frontend para probar el feature y se evita duplicarla si el API ya la incluye.
  protected readonly navItems = computed<MenuItem[]>(() => {
    const menu = this.auth.menu();
    const hasSettings = menu.some(
      (item) =>
        item.route === '/settings' || item.children.some((child) => child.route === '/settings'),
    );

    if (hasSettings) {
      return menu;
    }

    return [
      ...menu,
      {
        id: -1,
        label: 'Configuración',
        route: '/settings',
        icon: 'M12 15.75A3.75 3.75 0 1 0 12 8.25a3.75 3.75 0 0 0 0 7.5Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.08A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.12.6.65 1.04 1.27 1.04H21a2 2 0 1 1 0 4h-.09c-.62 0-1.15.43-1.51 1Z',
        children: [],
      },
    ];
  });

  // Controla el diálogo de confirmación de cierre de sesión.
  protected readonly confirmLogout = signal(false);

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
  // (la sesión local ya quedó limpia por el servicio). Limpia también el estado
  // de caja para que el siguiente usuario no vea el turno anterior.
  protected logout(): void {
    this.cashRegister.reset();
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
