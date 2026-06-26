import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError, extractApiError } from '../../../core/models/api';
import { CashRegisterSessionDto, OpenSessionRequest } from '../../../core/models/cash-register';
import { CashRegisterService } from '../../../core/services/cash-register-service';

// Pantalla de apertura de turno (POST /api/cash-register/sessions). Si ya hay un turno
// abierto el backend no permite abrir otro, así que se consulta primero el turno actual
// y se muestra un aviso en ese caso.
@Component({
  selector: 'app-open-register',
  templateUrl: './open-register.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
})
export class OpenRegister {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly router = inject(Router);

  protected readonly loadingCurrent = signal(true);
  protected readonly current = signal<CashRegisterSessionDto | null>(null);
  protected readonly saving = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);

  // Turno recién abierto: muestra el estado de éxito.
  protected readonly opened = signal<CashRegisterSessionDto | null>(null);

  protected readonly form = this.fb.group({
    openingFund: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)],
    ],
    notes: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.loadCurrent();
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: OpenSessionRequest = {
      openingFund: Number(value.openingFund),
      notes: value.notes.trim() || undefined,
    };

    this.saving.set(true);
    this.apiError.set(null);

    this.cashRegisterService.openSession(body).subscribe({
      next: (session) => {
        this.saving.set(false);
        this.opened.set(session);
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  private loadCurrent(): void {
    this.loadingCurrent.set(true);
    this.cashRegisterService.getCurrent().subscribe({
      next: (session) => {
        this.current.set(session);
        this.loadingCurrent.set(false);
      },
      error: () => {
        this.current.set(null);
        this.loadingCurrent.set(false);
      },
    });
  }
}
