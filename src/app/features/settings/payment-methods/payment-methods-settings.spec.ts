import { TestBed } from '@angular/core/testing';
import { PaymentMethodsSettings } from './payment-methods-settings';

describe('PaymentMethodsSettings', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaymentMethodsSettings] }).compileComponents();
  });

  it('creates a payment method from the side panel', () => {
    const fixture = TestBed.createComponent(PaymentMethodsSettings);
    fixture.detectChanges();

    const create = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Nuevo método'))!;
    create.click();
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('#payment-method-name') as HTMLInputElement;
    name.value = 'Vales';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="payment-method-row"]'),
    ).toHaveLength(4);
    expect(fixture.nativeElement.textContent).toContain('Vales');
  });

  it('edits an existing method without changing the number of rows', () => {
    const fixture = TestBed.createComponent(PaymentMethodsSettings);
    fixture.detectChanges();

    const edit = fixture.nativeElement.querySelector(
      'button[aria-label="Editar Efectivo"]',
    ) as HTMLButtonElement;
    edit.click();
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('#payment-method-name') as HTMLInputElement;
    expect(name.value).toBe('Efectivo');
    name.value = 'Efectivo MX';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="payment-method-row"]'),
    ).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain('Efectivo MX');
  });

  it('does not expose a delete action', () => {
    const fixture = TestBed.createComponent(PaymentMethodsSettings);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Eliminar');
  });
});
