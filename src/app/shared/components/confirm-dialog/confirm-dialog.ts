import { Component, input, model, output } from '@angular/core';
import { Modal } from '../modal/modal';

// Modal de confirmación reutilizable: envuelve app-modal y expone un mensaje
// con botones Cancelar/Confirmar. Emite `confirmed` solo cuando el usuario acepta.
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  imports: [Modal],
})
export class ConfirmDialog {
  readonly open = model(false);
  readonly title = input('Confirmar');
  readonly message = input('');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmed = output<void>();

  protected confirm(): void {
    this.open.set(false);
    this.confirmed.emit();
  }
}
