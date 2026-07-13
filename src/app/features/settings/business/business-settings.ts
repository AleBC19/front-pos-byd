import { Component, signal } from '@angular/core';

interface BusinessForm {
  tradeName: string;
  legalName: string;
  rfc: string;
  phone: string;
  email: string;
  address: string;
}

@Component({
  selector: 'app-business-settings',
  templateUrl: './business-settings.html',
})
export class BusinessSettings {
  protected readonly form = signal<BusinessForm>({
    tradeName: 'DDVC Punto de Venta',
    legalName: 'Mi Negocio S.A. de C.V.',
    rfc: 'MNE000101000',
    phone: '55 1234 5678',
    email: 'contacto@minegocio.com',
    address: 'Av. Siempre Viva 123, Ciudad, País',
  });
  protected readonly saved = signal(false);

  protected updateField(field: keyof BusinessForm, value: string): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.saved.set(false);
  }

  protected save(): void {
    this.saved.set(true);
  }
}
