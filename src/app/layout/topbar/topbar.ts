import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth-service';
import { CashRegisterService } from '../../core/services/cash-register-service';
import { CashRegisterSessionDto } from '../../core/models/cash-register';

// Barra superior: estado de sesión (caja activa, usuario, notificaciones, fecha/hora).
@Component({
  selector: 'app-topbar',
  imports: [DatePipe],
  templateUrl: './topbar.html',
})
export class Topbar implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cashRegister = inject(CashRegisterService);
  private readonly destroyRef = inject(DestroyRef);

  // Usuario en sesión (nombre y rol) desde el servicio de autenticación.
  protected readonly currentUser = this.auth.currentUser;

  // Turno de caja abierto actual; null cuando no hay ninguno (204).
  protected readonly currentSession = signal<CashRegisterSessionDto | null>(null);

  // Reloj en vivo para fecha y hora.
  protected readonly now = signal(new Date());

  // Contador de notificaciones (placeholder hasta tener backend).
  protected readonly notificationCount = signal(0);

  ngOnInit(): void {
    this.cashRegister.getCurrent().subscribe({
      next: (session) => this.currentSession.set(session),
      error: () => this.currentSession.set(null),
    });

    const clock = setInterval(() => this.now.set(new Date()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(clock));
  }
}
