import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserRequest, UpdateUserRequest, UserDto } from '../models/user';

// CRUD de usuarios contra /api/users. El endpoint requiere rol Administrador;
// el token lo adjunta authInterceptor. La lista no admite filtros ni paginación
// de servidor (devuelve solo usuarios activos), por eso se gestionan en cliente.
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.baseUrl);
  }

  getUser(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/${id}`);
  }

  createUser(body: CreateUserRequest): Observable<UserDto> {
    return this.http.post<UserDto>(this.baseUrl, body);
  }

  updateUser(id: number, body: UpdateUserRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.baseUrl}/${id}`, body);
  }

  // Borrado suave: el API marca el usuario como inactivo.
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
