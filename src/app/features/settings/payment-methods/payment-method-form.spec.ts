import { TestBed } from '@angular/core/testing';
import { PaymentMethodForm } from './payment-method-form';

describe('PaymentMethodForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaymentMethodForm] }).compileComponents();
  });

  it('requires a valid name', () => {
    const fixture = TestBed.createComponent(PaymentMethodForm);
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'El nombre es obligatorio (2 a 100 caracteres).',
    );
  });

  it('rejects duplicate names ignoring letter case', () => {
    const fixture = TestBed.createComponent(PaymentMethodForm);
    fixture.componentRef.setInput('reservedNames', ['Efectivo']);
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('#payment-method-name') as HTMLInputElement;
    name.value = 'efectivo';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Ya existe un método de pago con este nombre.',
    );
  });

  it('emits normalized form data', () => {
    const fixture = TestBed.createComponent(PaymentMethodForm);
    const emitted: unknown[] = [];
    fixture.componentInstance.saved.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('#payment-method-name') as HTMLInputElement;
    const description = fixture.nativeElement.querySelector(
      '#payment-method-description',
    ) as HTMLTextAreaElement;
    name.value = '  Vales  ';
    name.dispatchEvent(new Event('input'));
    description.value = '  Vales de despensa  ';
    description.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    submit.click();

    expect(emitted).toEqual([{ name: 'Vales', description: 'Vales de despensa', enabled: true }]);
  });
});
