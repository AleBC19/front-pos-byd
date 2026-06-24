import { Component, computed, inject, output, signal } from '@angular/core';
import { extractApiError } from '../../../core/models/api';
import { RoleDto } from '../../../core/models/role';
import { USER_PAGE_SIZES, UserDto } from '../../../core/models/user';
import { RolesService } from '../../../core/services/roles-service';
import { UsersService } from '../../../core/services/users-service';
import { Modal } from '../../../shared/components/modal/modal';

type StatusFilter = 'all' | 'active' | 'inactive';

// Paleta fija para los avatares (el API no provee color); se elige por id.
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

// Tab "Usuarios": lista conectada a /api/users. La búsqueda, el filtro de rol/estado
// y la paginación se resuelven en cliente (el API devuelve un array plano de activos).
// Los roles del filtro se cargan de /api/roles (RolesService).
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  imports: [Modal],
})
export class UserList {
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);

  // Roles para el filtro (cargados de /api/roles).
  protected readonly roles = signal<RoleDto[]>([]);
  protected readonly pageSizes = USER_PAGE_SIZES;

  // Datos y estado de la petición.
  protected readonly users = signal<UserDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Filtros y paginación (cliente).
  protected readonly search = signal('');
  protected readonly roleFilter = signal<number | 'all'>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly page = signal(1);
  protected readonly pageSize = signal<number>(USER_PAGE_SIZES[0]);

  // El contenedor abre el panel lateral con el usuario a editar.
  readonly editUser = output<UserDto>();

  // Modal de desactivación.
  protected readonly deactivateOpen = signal(false);
  protected readonly userToDeactivate = signal<UserDto | null>(null);
  protected readonly deactivating = signal(false);

  // Usuarios tras aplicar búsqueda y filtros.
  protected readonly filteredUsers = computed(() => {
    const term = this.search().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter((user) => {
      if (role !== 'all' && user.rolId !== role) {
        return false;
      }
      if (status === 'active' && !user.isActive) {
        return false;
      }
      if (status === 'inactive' && user.isActive) {
        return false;
      }
      if (term) {
        const haystack = `${this.fullName(user)} ${user.username}`.toLowerCase();
        return haystack.includes(term);
      }
      return true;
    });
  });

  protected readonly totalCount = computed(() => this.filteredUsers().length);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize())),
  );

  // Página visible (recortada del listado filtrado).
  protected readonly pagedUsers = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  protected readonly rangeStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalCount()),
  );

  constructor() {
    // El filtro de rol se llena de /api/roles; si falla, queda solo "Todos".
    this.rolesService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => undefined,
    });
    this.load();
  }

  reload(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.page.set(1);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }

  protected fullName(user: UserDto): string {
    return [user.firstName, user.secondName, user.lastName].filter(Boolean).join(' ');
  }

  protected initials(user: UserDto): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  protected avatarColor(user: UserDto): string {
    return AVATAR_COLORS[user.id % AVATAR_COLORS.length];
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected onRoleChange(value: string): void {
    this.roleFilter.set(value === 'all' ? 'all' : Number(value));
    this.page.set(1);
  }

  protected onStatusChange(value: string): void {
    this.statusFilter.set(value as StatusFilter);
    this.page.set(1);
  }

  protected onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.roleFilter.set('all');
    this.statusFilter.set('all');
    this.page.set(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }
    this.page.set(page);
  }

  protected openDeactivate(user: UserDto): void {
    this.userToDeactivate.set(user);
    this.deactivateOpen.set(true);
  }

  // Borrado suave: el API marca el usuario como inactivo. Falla con 409 si el
  // usuario intenta desactivarse a sí mismo; el mensaje se muestra en el banner.
  protected confirmDeactivate(): void {
    const user = this.userToDeactivate();
    if (!user) {
      return;
    }

    this.deactivating.set(true);
    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.deactivating.set(false);
        this.deactivateOpen.set(false);
        this.userToDeactivate.set(null);
        this.load();
      },
      error: (err) => {
        this.deactivating.set(false);
        this.deactivateOpen.set(false);
        this.error.set(extractApiError(err).message);
      },
    });
  }
}
