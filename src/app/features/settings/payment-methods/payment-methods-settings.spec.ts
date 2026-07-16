import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PaymentSettingsDto } from '../../../core/models/configuration';
import { ConfigurationService } from '../../../core/services/configuration-service';
import { PaymentMethodsSettings } from './payment-methods-settings';

const settings: PaymentSettingsDto = {
  cashEnabled: true,
  debitCardEnabled: false,
  creditCardEnabled: false,
  bankTransferEnabled: false,
  cardBank: null,
  cardTerminalId: null,
  transferAccountNumber: null,
  transferAccountHolder: null,
};

describe('PaymentMethodsSettings', () => {
  let saved: PaymentSettingsDto | null;

  beforeEach(async () => {
    saved = null;
    const configuration: Partial<ConfigurationService> = {
      getPaymentSettings: () => of(settings),
      savePaymentSettings: (body) => {
        saved = body;
        return of(body);
      },
    };

    await TestBed.configureTestingModule({
      imports: [PaymentMethodsSettings],
      providers: [{ provide: ConfigurationService, useValue: configuration }],
    }).compileComponents();
  });

  it('renders the four fixed payment methods and no custom-method creation', () => {
    const fixture = TestBed.createComponent(PaymentMethodsSettings);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Efectivo');
    expect(text).toContain('Tarjeta de débito');
    expect(text).toContain('Tarjeta de crédito');
    expect(text).toContain('Transferencia');
    expect(text).not.toContain('Nuevo método');
  });

  it('reveals the card fields when a card method is enabled', () => {
    const fixture = TestBed.createComponent(PaymentMethodsSettings);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Datos de tarjeta');

    const debit = fixture.nativeElement.querySelector(
      'button[aria-label="Activar Tarjeta de débito"]',
    ) as HTMLButtonElement;
    debit.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Datos de tarjeta');
  });

  it('saves the settings through the service', () => {
    const fixture = TestBed.createComponent(PaymentMethodsSettings);
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();

    expect(saved).not.toBeNull();
    expect(saved?.cashEnabled).toBe(true);
  });
});
