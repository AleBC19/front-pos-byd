import { Component, signal } from '@angular/core';
import { ROLE_PERMISSIONS, ROLES } from '../data/users-mock';

// Tab "Roles y permisos": matriz de permisos del rol seleccionado.
// Solo estructura sobre datos de muestra; los toggles aún no persisten cambios.
@Component({
  selector: 'app-roles-permissions',
  templateUrl: './roles-permissions.html',
})
export class RolesPermissions {
  protected readonly roles = ROLES;
  protected readonly permissions = ROLE_PERMISSIONS;
  protected readonly selectedRole = signal<string>('Vendedor');
}
