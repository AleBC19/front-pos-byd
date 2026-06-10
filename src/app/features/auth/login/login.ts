import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import {
  getAvatarColor,
  getInitials,
  LOGIN_SESSION_INFO,
  PIN_LENGTH,
  QUICK_PROFILES,
  QuickProfile,
} from '../data/login-mock';

type LoginTab = 'credentials' | 'quick';

// Pantalla de inicio de sesión (réplica del mockup public/mockups/login-view.png).
// Dos modos: usuario/contraseña y acceso rápido por PIN. Funcionalidad dummy.
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [ReactiveFormsModule],
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly profiles = QUICK_PROFILES;
  protected readonly sessionInfo = LOGIN_SESSION_INFO;
  protected readonly pinLength = PIN_LENGTH;
  protected readonly pinSlots = Array.from({ length: PIN_LENGTH });

  protected readonly activeTab = signal<LoginTab>('credentials');
  protected readonly showPassword = signal(false);
  protected readonly loginError = signal(false);
  protected readonly selectedProfile = signal<QuickProfile | null>(null);
  protected readonly pin = signal('');
  protected readonly pinError = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    usuario: [this.auth.rememberedUsername() ?? '', Validators.required],
    contrasena: ['', Validators.required],
    recordar: [this.auth.rememberedUsername() !== null],
  });

  // Iniciales y color del avatar de cada perfil (helpers compartidos).
  protected readonly initials = getInitials;
  protected readonly avatarColor = getAvatarColor;

  protected selectTab(tab: LoginTab): void {
    this.activeTab.set(tab);
    this.loginError.set(false);
    if (tab === 'credentials') {
      this.resetPin();
    }
  }

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { usuario, contrasena, recordar } = this.form.getRawValue();
    const ok = this.auth.login({ username: usuario, password: contrasena }, recordar);

    if (ok) {
      this.router.navigate(['/dashboard']);
    } else {
      this.loginError.set(true);
    }
  }

  // --- Acceso rápido por PIN ---

  protected selectProfile(profile: QuickProfile): void {
    this.selectedProfile.set(profile);
    this.resetPin();
  }

  // Desde la tarjeta de perfil ("Ingresar PIN"): abre la pestaña de PIN con el perfil elegido.
  protected openPinFor(profile: QuickProfile): void {
    this.activeTab.set('quick');
    this.selectProfile(profile);
  }

  protected backToProfiles(): void {
    this.selectedProfile.set(null);
    this.resetPin();
  }

  protected pressDigit(digit: string): void {
    if (this.pin().length >= this.pinLength) {
      return;
    }

    this.pinError.set(false);
    const next = this.pin() + digit;
    this.pin.set(next);

    if (next.length === this.pinLength) {
      this.submitPin();
    }
  }

  protected backspace(): void {
    this.pinError.set(false);
    this.pin.update((value) => value.slice(0, -1));
  }

  protected submitPin(): void {
    const profile = this.selectedProfile();
    if (!profile) {
      return;
    }

    const ok = this.auth.loginWithPin(profile.id, this.pin());

    if (ok) {
      this.router.navigate(['/dashboard']);
    } else {
      this.pinError.set(true);
      this.pin.set('');
    }
  }

  protected readonly filledPin = computed(() => this.pin().length);

  private resetPin(): void {
    this.pin.set('');
    this.pinError.set(false);
  }
}
