import { Component, signal, viewChild } from '@angular/core';
import { UserDto } from '../../../core/models/user';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { RecentAccess } from '../recent-access/recent-access';
import { RolesPermissions } from '../roles-permissions/roles-permissions';
import { UserForm } from '../user-form/user-form';
import { UserList } from '../user-list/user-list';

type UsersTab = 'users' | 'roles' | 'recent';

// Contenedor de la vista "Usuarios y permisos": encabezado + barra de tabs
// que alterna entre la lista de usuarios, los permisos por rol y los accesos recientes.
// Es dueño del panel lateral de alta/edición (lo abre el botón "Nuevo usuario"
// y el evento de edición que emite la lista).
@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.html',
  imports: [UserList, RolesPermissions, RecentAccess, SidePanel, UserForm],
})
export class UsersPage {
  protected readonly activeTab = signal<UsersTab>('users');

  // Referencia a la lista para recargarla tras guardar en el panel.
  private readonly userList = viewChild(UserList);

  // Panel lateral de alta/edición.
  protected readonly panelOpen = signal(false);
  protected readonly panelTitle = signal('Nuevo usuario');
  protected readonly editingUser = signal<UserDto | null>(null);

  protected setTab(tab: UsersTab): void {
    this.activeTab.set(tab);
  }

  protected openCreate(): void {
    // El alta solo tiene sentido en la tab de usuarios; asegura que la lista esté montada.
    this.activeTab.set('users');
    this.editingUser.set(null);
    this.panelTitle.set('Nuevo usuario');
    this.panelOpen.set(true);
  }

  protected openEdit(user: UserDto): void {
    this.editingUser.set(user);
    this.panelTitle.set('Editar usuario');
    this.panelOpen.set(true);
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
    this.editingUser.set(null);
  }

  protected onSaved(): void {
    this.closePanel();
    this.userList()?.reload();
  }
}
