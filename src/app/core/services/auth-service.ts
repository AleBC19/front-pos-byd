import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  KnownUser,
  LoginCredentials,
  LoginPinRequest,
  LoginResponse,
  Session,
  User,
} from '../models/user';

const SESSION_KEY = 'pos.session';
const REMEMBERED_USER_KEY = 'pos.rememberedUser';
const KNOWN_USERS_KEY = 'pos.knownUsers';
const MAX_KNOWN_USERS = 8;

// Servicio de autenticación contra el API (JWT): persiste la sesión
// (token + expiración + usuario) en localStorage y expone el estado
// como signals para guards, interceptores y vistas.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<Session | null>(this.restoreSession());
  private readonly knownUsersSignal = signal<KnownUser[]>(this.restoreKnownUsers());

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly token = computed(() => this.session()?.token ?? null);

  // Menú de navegación entregado en el login (ya filtrado por permisos en el API).
  readonly menu = computed(() => this.session()?.menu ?? []);

  // Usuarios que ya iniciaron sesión en este equipo (acceso rápido por PIN).
  readonly knownUsers = this.knownUsersSignal.asReadonly();

  // Login por usuario y contraseña contra POST /api/auth/login.
  login(credentials: LoginCredentials, remember: boolean): Observable<User> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, credentials)
      .pipe(
        map((response) => this.toSession(response)),
        tap((session) => {
          this.persistSession(session);

          if (remember) {
            localStorage.setItem(REMEMBERED_USER_KEY, credentials.username);
          } else {
            localStorage.removeItem(REMEMBERED_USER_KEY);
          }
        }),
        map((session) => session.user),
      );
  }

  // Usuario recordado para precargar el formulario ("Recordar usuario").
  rememberedUsername(): string | null {
    return localStorage.getItem(REMEMBERED_USER_KEY);
  }

  // Cierra la sesión contra POST /api/auth/logout y limpia la sesión local
  // pase lo que pase con el API (offline, token expirado, etc.).
  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.apiBaseUrl}/auth/logout`, {})
      .pipe(finalize(() => this.clearSession()));
  }

  // Limpia la sesión local sin llamar al API (mantiene el usuario recordado).
  clearSession(): void {
    this.session.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  // Login por PIN contra POST /api/auth/login-pin.
  loginWithPin(request: LoginPinRequest): Observable<User> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login-pin`, request)
      .pipe(
        map((response) => this.toSession(response)),
        tap((session) => this.persistSession(session)),
        map((session) => session.user),
      );
  }

  // Olvida un usuario recordado de este equipo (botón de quitar tarjeta).
  forgetKnownUser(username: string): void {
    const remaining = this.knownUsersSignal().filter(
      (known) => known.username.toLowerCase() !== username.toLowerCase(),
    );
    this.saveKnownUsers(remaining);
  }

  private toSession(response: LoginResponse): Session {
    const menu = response.menu ?? [];
    return {
      token: response.token,
      expiresAtUtc: response.expiresAtUtc,
      user: {
        id: String(response.userId),
        name: response.fullName,
        username: response.username,
        role: response.role,
        permissions: response.permissions ?? [],
      },
      menu,
    };
  }

  private persistSession(session: Session): void {
    this.session.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.addKnownUser(session.user);
  }

  // Agrega (o refresca) al usuario en la lista de recordados del equipo:
  // sin duplicados, el más reciente primero y con tope de tamaño.
  private addKnownUser(user: User): void {
    const entry: KnownUser = { username: user.username, fullName: user.name, role: user.role };
    const rest = this.knownUsersSignal().filter(
      (known) => known.username.toLowerCase() !== user.username.toLowerCase(),
    );
    this.saveKnownUsers([entry, ...rest].slice(0, MAX_KNOWN_USERS));
  }

  private saveKnownUsers(users: KnownUser[]): void {
    this.knownUsersSignal.set(users);
    localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(users));
  }

  private restoreKnownUsers(): KnownUser[] {
    const raw = localStorage.getItem(KNOWN_USERS_KEY);
    if (!raw) {
      return [];
    }

    try {
      const users = JSON.parse(raw) as KnownUser[];
      return Array.isArray(users) ? users : [];
    } catch {
      localStorage.removeItem(KNOWN_USERS_KEY);
      return [];
    }
  }

  private restoreSession(): Session | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      const session = JSON.parse(raw) as Session;

      // Descarta sesiones con formato viejo (sin token o token vacío) o expiradas.
      if (!session.token || typeof session.token !== 'string' || !session.expiresAtUtc || this.isExpired(session)) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  private isExpired(session: Session): boolean {
    return Date.now() >= new Date(session.expiresAtUtc).getTime();
  }
}
