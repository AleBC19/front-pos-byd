import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PermissionDto, RoleDto, SetRolePermissionsRequest } from '../models/role';

// Roles y permisos contra /api/roles y /api/permissions. Requiere el permiso
// administrar_usuarios; el token lo adjunta authInterceptor.
@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/roles`;

  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(this.baseUrl);
  }

  getRole(id: number): Observable<RoleDto> {
    return this.http.get<RoleDto>(`${this.baseUrl}/${id}`);
  }

  // Catálogo de permisos disponibles del sistema.
  getPermissions(): Observable<PermissionDto[]> {
    return this.http.get<PermissionDto[]>(`${environment.apiBaseUrl}/permissions`);
  }

  // Reemplaza por completo los permisos de un rol.
  setRolePermissions(id: number, permissions: string[]): Observable<RoleDto> {
    const body: SetRolePermissionsRequest = { permissions };
    return this.http.put<RoleDto>(`${this.baseUrl}/${id}/permissions`, body);
  }
}
