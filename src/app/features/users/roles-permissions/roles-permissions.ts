import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PermissionDto, RoleDto } from '../../../core/models/role';
import { RolesService } from '../../../core/services/roles-service';

// Íconos (heroicons outline) por código de permiso; el API no provee íconos.
const PERMISSION_ICONS: Record<string, string> = {
  realizar_ventas:
    'M2.25 3h1.4a1.1 1.1 0 0 1 1.06.8L5.4 6m0 0 1.8 6.6a1.1 1.1 0 0 0 1.06.8h8.94a1.1 1.1 0 0 0 1.04-.74L20.6 6.7A.55.55 0 0 0 20.08 6H5.4Zm2.1 13.5a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Zm10.5 0a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Z',
  aplicar_descuentos:
    'M9 14.25 14.25 9M9.75 9.75h.008v.008H9.75V9.75Zm4.5 4.5h.008v.008h-.008v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  procesar_devoluciones: 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
  ver_reportes:
    'M9 17.25v-6m3.75 6V7.5m3.75 9.75v-3M4.88 20.25h14.24a1.13 1.13 0 0 0 1.13-1.13V4.88a1.13 1.13 0 0 0-1.13-1.13H4.88a1.13 1.13 0 0 0-1.13 1.13v14.24c0 .62.5 1.13 1.13 1.13Z',
  administrar_productos:
    'm21 7.5-9-4.5-9 4.5m18 0-9 4.5m9-4.5v9l-9 4.5m0-9L3 7.5m9 4.5v9m-9-13.5v9l9 4.5',
  administrar_inventario:
    'M3.75 8.25h16.5M4.5 8.25a1.5 1.5 0 0 1 0-3h15a1.5 1.5 0 0 1 0 3m-15 0V18a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 18V8.25',
  administrar_usuarios:
    'M15 19.13v-1.5a4.13 4.13 0 0 0-4.12-4.13H5.63A4.13 4.13 0 0 0 1.5 17.63v1.5M18 8.25v6m3-3h-6m-4.5-3.38a3.38 3.38 0 1 1-6.75 0 3.38 3.38 0 0 1 6.75 0Z',
  configurar_sistema:
    'M10.34 4.07c.15-.9.93-1.57 1.85-1.57.92 0 1.7.66 1.85 1.57l.09.55a1.7 1.7 0 0 0 2.45 1.21l.5-.26a1.88 1.88 0 0 1 2.42.69c.46.79.3 1.8-.38 2.4l-.42.37a1.7 1.7 0 0 0 0 2.56l.42.37c.68.6.84 1.61.38 2.4a1.88 1.88 0 0 1-2.42.69l-.5-.26a1.7 1.7 0 0 0-2.45 1.21l-.09.55c-.15.9-.93 1.57-1.85 1.57-.92 0-1.7-.66-1.85-1.57l-.09-.55a1.7 1.7 0 0 0-2.45-1.21l-.5.26a1.88 1.88 0 0 1-2.42-.69 1.88 1.88 0 0 1 .38-2.4l.42-.37a1.7 1.7 0 0 0 0-2.56l-.42-.37a1.88 1.88 0 0 1-.38-2.4 1.88 1.88 0 0 1 2.42-.69l.5.26a1.7 1.7 0 0 0 2.45-1.21l.09-.55ZM15 12.2a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z',
};

// Tab "Roles y permisos": matriz de permisos del rol seleccionado, contra
// /api/roles y /api/permissions. Los toggles reflejan los permisos reales del
// rol (solo lectura por ahora; persistir con setRolePermissions queda pendiente).
@Component({
  selector: 'app-roles-permissions',
  templateUrl: './roles-permissions.html',
})
export class RolesPermissions {
  private readonly rolesService = inject(RolesService);

  protected readonly roles = signal<RoleDto[]>([]);
  protected readonly permissions = signal<PermissionDto[]>([]);
  protected readonly selectedRoleId = signal<number | null>(null);
  protected readonly loading = signal(false);

  // Rol seleccionado completo (con sus códigos de permiso).
  protected readonly selectedRole = computed(
    () => this.roles().find((role) => role.id === this.selectedRoleId()) ?? null,
  );

  constructor() {
    this.loading.set(true);
    forkJoin({
      roles: this.rolesService.getRoles(),
      permissions: this.rolesService.getPermissions(),
    }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles.set(roles);
        this.permissions.set(permissions);
        this.selectedRoleId.set(roles[0]?.id ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onRoleChange(value: string): void {
    this.selectedRoleId.set(value ? Number(value) : null);
  }

  // ¿El rol seleccionado tiene este permiso?
  protected isEnabled(code: string): boolean {
    return this.selectedRole()?.permissions.includes(code) ?? false;
  }

  protected iconFor(code: string): string {
    return PERMISSION_ICONS[code] ?? '';
  }
}
