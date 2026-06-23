import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError, extractApiError } from '../../../core/models/api';
import {
  CreateUserRequest,
  UpdateUserRequest,
  USER_ROLES,
  UserDto,
} from '../../../core/models/user';
import { UsersService } from '../../../core/services/users-service';

// Formulario de alta/edición del panel lateral "Editar usuario", conectado a
// /api/users (POST al crear, PUT al editar). En edición, contraseña y PIN son
// opcionales: dejarlos vacíos conserva los actuales.
@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.html',
  imports: [ReactiveFormsModule],
})
export class UserForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly usersService = inject(UsersService);

  // Usuario a editar; null = alta. El panel reutiliza la instancia, por eso un
  // effect repuebla o limpia el formulario cuando cambia la entrada.
  readonly user = input<UserDto | null>(null);

  readonly cancelled = output<void>();
  readonly saved = output<UserDto>();

  protected readonly roles = USER_ROLES;
  protected readonly showPassword = signal(false);
  protected readonly showPin = signal(false);
  protected readonly saving = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);

  protected readonly isEdit = computed(() => this.user() !== null);

  protected readonly avatarInitials = computed(() => {
    const user = this.user();
    if (!user) {
      return '';
    }
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  });

  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    secondName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    password: '',
    pin: '',
    rolId: [USER_ROLES[0].id, [Validators.required]],
    isActive: true,
  });

  constructor() {
    effect(() => {
      const user = this.user();
      this.apiError.set(null);
      this.applyPasswordValidators(user === null);

      if (user) {
        this.form.reset({
          username: user.username,
          firstName: user.firstName,
          secondName: user.secondName ?? '',
          lastName: user.lastName,
          password: '',
          pin: '',
          rolId: user.rolId,
          isActive: user.isActive,
        });
      } else {
        this.form.reset({ rolId: USER_ROLES[0].id, isActive: true });
      }
    });
  }

  // En alta, contraseña y PIN son obligatorios; en edición solo se validan
  // si el usuario escribe un valor (para cambiarlos).
  private applyPasswordValidators(creating: boolean): void {
    const password = this.form.controls.password;
    const pin = this.form.controls.pin;

    password.setValidators(
      creating
        ? [Validators.required, Validators.minLength(8)]
        : [Validators.minLength(8)],
    );
    pin.setValidators(
      creating
        ? [Validators.required, Validators.pattern(/^\d{4}$/)]
        : [Validators.pattern(/^\d{4}$/)],
    );
    password.updateValueAndValidity({ emitEvent: false });
    pin.updateValueAndValidity({ emitEvent: false });
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected togglePin(): void {
    this.showPin.update((value) => !value);
  }

  // Genera un PIN de 4 dígitos y lo coloca en el control.
  protected generatePin(): void {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    this.form.controls.pin.setValue(pin);
    this.form.controls.pin.markAsDirty();
    this.showPin.set(true);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const current = this.user();

    this.saving.set(true);
    this.apiError.set(null);

    const request = current
      ? this.usersService.updateUser(current.id, this.toUpdateRequest(value))
      : this.usersService.createUser(this.toCreateRequest(value));

    request.subscribe({
      next: (user) => {
        this.saving.set(false);
        this.saved.emit(user);
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  private toCreateRequest(value: ReturnType<typeof this.form.getRawValue>): CreateUserRequest {
    return {
      username: value.username.trim(),
      firstName: value.firstName.trim(),
      secondName: value.secondName.trim() || undefined,
      lastName: value.lastName.trim(),
      password: value.password,
      pin: value.pin,
      rolId: value.rolId,
    };
  }

  private toUpdateRequest(value: ReturnType<typeof this.form.getRawValue>): UpdateUserRequest {
    return {
      username: value.username.trim(),
      firstName: value.firstName.trim(),
      secondName: value.secondName.trim() || undefined,
      lastName: value.lastName.trim(),
      // Vacío = no cambiar.
      password: value.password.trim() || undefined,
      pin: value.pin.trim() || undefined,
      rolId: value.rolId,
      isActive: value.isActive,
    };
  }
}
