import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError } from '../../../core/models/api';
import { KnownUser } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth-service';
import {
  getAvatarColor,
  getInitials,
  LOGIN_SESSION_INFO,
  PIN_LENGTH,
} from '../data/login-helpers';

type LoginTab = 'credentials' | 'quick';

// Usuario al que se le pedirá el PIN: desde una tarjeta de usuario recordado
// o escrito manualmente ("otro usuario", sin nombre completo ni rol).
interface PinTarget {
  username: string;
  fullName: string;
  role: string | null;
}

// Pantalla de inicio de sesión (réplica del mockup public/mockups/login-view.png).
// Dos modos contra el API: usuario/contraseña y acceso rápido por PIN.
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [ReactiveFormsModule],
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly knownUsers = this.auth.knownUsers;
  protected readonly sessionInfo = LOGIN_SESSION_INFO;
  protected readonly pinLength = PIN_LENGTH;
  protected readonly pinSlots = Array.from({ length: PIN_LENGTH });

  protected readonly activeTab = signal<LoginTab>('credentials');
  protected readonly showPassword = signal(false);
  protected readonly loginError = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly pinTarget = signal<PinTarget | null>(null);
  protected readonly manualEntry = signal(false);
  protected readonly pin = signal('');
  protected readonly pinError = signal<string | null>(null);
  protected readonly pinLoading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    usuario: [this.auth.rememberedUsername() ?? '', Validators.required],
    contrasena: ['', Validators.required],
    recordar: [this.auth.rememberedUsername() !== null],
  });

  // Usuario escrito a mano para entrar por PIN ("otro usuario").
  protected readonly pinUsername = this.fb.nonNullable.control('', Validators.required);

  // Iniciales y color del avatar de cada usuario (helpers compartidos).
  protected readonly initials = getInitials;
  protected readonly avatarColor = getAvatarColor;

  protected selectTab(tab: LoginTab): void {
    this.activeTab.set(tab);
    this.loginError.set(null);
    if (tab === 'credentials') {
      this.resetPin();
    } else if (this.knownUsers().length === 0 && !this.pinTarget()) {
      // Sin usuarios recordados: ir directo a escribir el usuario.
      this.manualEntry.set(true);
    }
  }

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const { usuario, contrasena, recordar } = this.form.getRawValue();
    this.loading.set(true);
    this.loginError.set(null);

    this.auth.login({ username: usuario, password: contrasena }, recordar).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.loginError.set(
          error.status === 401 || error.status === 400
            ? ((error.error as ApiError)?.message ?? 'Usuario o contraseña incorrectos.')
            : 'No se pudo conectar con el servidor. Intenta de nuevo.',
        );
      },
    });
  }

  // --- Acceso rápido por PIN ---

  protected selectUser(user: KnownUser): void {
    this.pinTarget.set({ username: user.username, fullName: user.fullName, role: user.role });
    this.manualEntry.set(false);
    this.resetPin();
  }

  // Desde la tarjeta de usuario ("Ingresar PIN"): abre la pestaña de PIN con el usuario elegido.
  protected openPinFor(user: KnownUser): void {
    this.activeTab.set('quick');
    this.selectUser(user);
  }

  // Entrada manual de usuario para quienes no aparecen en las tarjetas.
  protected startManualEntry(): void {
    this.activeTab.set('quick');
    this.pinTarget.set(null);
    this.manualEntry.set(true);
    this.pinUsername.reset('');
    this.resetPin();
  }

  protected confirmManualUsername(): void {
    const username = this.pinUsername.value.trim();
    if (!username) {
      this.pinUsername.markAsTouched();
      return;
    }

    this.pinTarget.set({ username, fullName: username, role: null });
    this.manualEntry.set(false);
    this.resetPin();
  }

  protected removeKnownUser(user: KnownUser): void {
    this.auth.forgetKnownUser(user.username);
    if (this.pinTarget()?.username === user.username) {
      this.backToUsers();
    }
  }

  protected backToUsers(): void {
    this.pinTarget.set(null);
    this.manualEntry.set(false);
    this.resetPin();
  }

  protected pressDigit(digit: string): void {
    if (this.pin().length >= this.pinLength || this.pinLoading()) {
      return;
    }

    this.pinError.set(null);
    const next = this.pin() + digit;
    this.pin.set(next);

    if (next.length === this.pinLength) {
      this.submitPin();
    }
  }

  protected backspace(): void {
    if (this.pinLoading()) {
      return;
    }

    this.pinError.set(null);
    this.pin.update((value) => value.slice(0, -1));
  }

  // Login por PIN contra el API; en error limpia el PIN y muestra el mensaje.
  protected submitPin(): void {
    const target = this.pinTarget();
    if (!target || this.pin().length !== this.pinLength || this.pinLoading()) {
      return;
    }

    this.pinLoading.set(true);
    this.pinError.set(null);

    this.auth.loginWithPin({ username: target.username, pin: this.pin() }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error: HttpErrorResponse) => {
        this.pinLoading.set(false);
        this.pin.set('');
        this.pinError.set(
          error.status === 401 || error.status === 400
            ? ((error.error as ApiError)?.message ?? 'Usuario o PIN incorrectos.')
            : 'No se pudo conectar con el servidor. Intenta de nuevo.',
        );
      },
    });
  }

  protected readonly filledPin = computed(() => this.pin().length);

  private resetPin(): void {
    this.pin.set('');
    this.pinError.set(null);
    this.pinLoading.set(false);
  }
}
