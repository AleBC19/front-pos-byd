import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AppNotification } from '../../core/models/notification';
import { AuthService } from '../../core/services/auth-service';
import { CashRegisterService } from '../../core/services/cash-register-service';

// Barra superior: estado de sesión (caja activa, usuario, notificaciones, fecha/hora).
@Component({
  selector: 'app-topbar',
  imports: [DatePipe],
  templateUrl: './topbar.html',
})
export class Topbar implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cashRegister = inject(CashRegisterService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Usuario en sesión (nombre y rol) desde el servicio de autenticación.
  protected readonly currentUser = this.auth.currentUser;

  // Turno de caja abierto actual (estado compartido); null cuando no hay ninguno.
  protected readonly currentSession = this.cashRegister.currentSession;

  // Reloj en vivo para fecha y hora.
  protected readonly now = signal(new Date());

  // Notificaciones a mostrar en el panel de la campana. Vacío por ahora (sin backend):
  // este es el punto único donde el futuro servicio/endpoint poblará los datos.
  protected readonly notifications = signal<AppNotification[]>([]);

  // Contador para el badge; deriva de la lista.
  protected readonly notificationCount = computed(() => this.notifications().length);

  // Visibilidad del panel desplegable de notificaciones.
  protected readonly panelOpen = signal(false);

  protected togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.panelOpen()) {
      this.panelOpen.set(false);
    }
  }

  ngOnInit(): void {
    // Carga inicial del turno (una vez por login: el shell no se recrea al navegar).
    this.cashRegister.refreshCurrent();

    // Refresca el corte al cambiar de pantalla (no-op si no hay turno abierto).
    const nav = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.cashRegister.refreshCurrentSummary());
    this.destroyRef.onDestroy(() => nav.unsubscribe());

    const clock = setInterval(() => this.now.set(new Date()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(clock));
  }
}
