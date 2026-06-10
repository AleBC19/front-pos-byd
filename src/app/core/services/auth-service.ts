import { computed, Injectable, signal } from '@angular/core';
import { LoginCredentials, User } from '../models/user';
import { DUMMY_CREDENTIALS, QUICK_PROFILES } from '../../features/auth/data/login-mock';

const SESSION_KEY = 'pos.session';
const REMEMBERED_USER_KEY = 'pos.rememberedUser';

// Servicio de autenticación dummy (sin backend): valida contra credenciales
// y perfiles de prueba, persiste la sesión en localStorage y expone el estado
// como signals para guards y vistas.
// TODO: reemplazar la lógica dummy por llamadas reales al API (JWT).
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<User | null>(this.restoreSession());

  readonly currentUser = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);

  // Login por usuario y contraseña. Devuelve true si las credenciales son válidas.
  login(credentials: LoginCredentials, remember: boolean): boolean {
    const isValid =
      credentials.username === DUMMY_CREDENTIALS.username &&
      credentials.password === DUMMY_CREDENTIALS.password;

    if (!isValid) {
      return false;
    }

    const user: User = {
      id: DUMMY_CREDENTIALS.username,
      name: 'María Gómez',
      username: credentials.username,
      role: 'Vendedor',
      permissions: [],
    };

    this.persistSession(user);

    if (remember) {
      localStorage.setItem(REMEMBERED_USER_KEY, credentials.username);
    } else {
      localStorage.removeItem(REMEMBERED_USER_KEY);
    }

    return true;
  }

  // Login por perfil rápido validando el PIN. Devuelve true si el PIN coincide.
  loginWithPin(profileId: string, pin: string): boolean {
    const profile = QUICK_PROFILES.find((p) => p.id === profileId);

    if (!profile || profile.pin !== pin) {
      return false;
    }

    const user: User = {
      id: profile.id,
      name: profile.name,
      username: profile.id,
      role: profile.role,
      permissions: [],
    };

    this.persistSession(user);
    return true;
  }

  // Usuario recordado para precargar el formulario ("Recordar usuario").
  rememberedUsername(): string | null {
    return localStorage.getItem(REMEMBERED_USER_KEY);
  }

  // Cierra la sesión actual (mantiene el usuario recordado).
  logout(): void {
    this.session.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private persistSession(user: User): void {
    this.session.set(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  private restoreSession(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
