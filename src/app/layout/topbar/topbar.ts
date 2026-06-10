import { Component, signal } from '@angular/core';

// Barra superior: título de la vista, filtro de periodo y estado de
// sesión (caja activa, usuario, notificaciones, fecha/hora).
// TODO: título dinámico por ruta; datos reales de sesión/caja.
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
})
export class Topbar {
  protected readonly periods = ['Hoy', 'Semana', 'Mes', 'Personalizado'];
  protected readonly activePeriod = signal('Hoy');

  protected selectPeriod(period: string): void {
    this.activePeriod.set(period);
  }
}
