import { Component, computed, signal } from '@angular/core';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { PaymentMethodForm } from './payment-method-form';
import { PaymentMethod, PaymentMethodFormValue } from './payment-method.models';

@Component({
  selector: 'app-payment-methods-settings',
  templateUrl: './payment-methods-settings.html',
  imports: [SidePanel, PaymentMethodForm],
})
export class PaymentMethodsSettings {
  protected readonly methods = signal<PaymentMethod[]>([
    { id: 'cash', name: 'Efectivo', description: 'Pagos recibidos en caja', enabled: true },
    { id: 'card', name: 'Tarjeta', description: 'Tarjetas de crédito y débito', enabled: true },
    {
      id: 'transfer',
      name: 'Transferencia',
      description: 'Transferencias bancarias',
      enabled: true,
    },
  ]);
  protected readonly panelOpen = signal(false);
  protected readonly panelTitle = signal('Nuevo método de pago');
  protected readonly editingMethod = signal<PaymentMethod | null>(null);
  protected readonly reservedNames = computed(() => {
    const editingId = this.editingMethod()?.id;
    return this.methods()
      .filter((method) => method.id !== editingId)
      .map((method) => method.name);
  });

  private nextCustomId = 1;

  protected openCreate(): void {
    this.editingMethod.set(null);
    this.panelTitle.set('Nuevo método de pago');
    this.panelOpen.set(true);
  }

  protected openEdit(method: PaymentMethod): void {
    this.editingMethod.set(method);
    this.panelTitle.set('Editar método de pago');
    this.panelOpen.set(true);
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
    this.editingMethod.set(null);
  }

  protected onSaved(value: PaymentMethodFormValue): void {
    const current = this.editingMethod();

    if (current) {
      this.methods.update((methods) =>
        methods.map((method) => (method.id === current.id ? { ...method, ...value } : method)),
      );
    } else {
      this.methods.update((methods) => [
        ...methods,
        { id: `custom-${this.nextCustomId++}`, ...value },
      ]);
    }

    this.closePanel();
  }

  protected toggle(id: string): void {
    this.methods.update((methods) =>
      methods.map((method) =>
        method.id === id ? { ...method, enabled: !method.enabled } : method,
      ),
    );
  }

  protected move(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.methods().length) return;

    this.methods.update((methods) => {
      const reordered = [...methods];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  }
}
