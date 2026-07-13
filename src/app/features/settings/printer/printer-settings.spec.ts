import { TestBed } from '@angular/core/testing';
import { PrinterSettings } from './printer-settings';

describe('PrinterSettings', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PrinterSettings] }).compileComponents();
  });

  it('renders the printer controls without the receipt preview', () => {
    const fixture = TestBed.createComponent(PrinterSettings);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Impresora y recibo');
    expect(element.textContent).toContain('58 mm');
    expect(element.textContent).toContain('80 mm');
    expect(element.textContent).not.toContain('Vista previa del recibo');
  });

  it('updates the cash drawer switch locally', () => {
    const fixture = TestBed.createComponent(PrinterSettings);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const control = element.querySelector(
      'button[aria-label="Activar cajón de dinero"]',
    ) as HTMLButtonElement;

    expect(control.getAttribute('aria-checked')).toBe('true');
    control.click();
    fixture.detectChanges();
    expect(control.getAttribute('aria-checked')).toBe('false');
  });
});
