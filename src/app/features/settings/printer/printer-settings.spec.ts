import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PrinterSettingsDto, ReceiptSettingsDto } from '../../../core/models/configuration';
import { ConfigurationService } from '../../../core/services/configuration-service';
import { PrinterSettings } from './printer-settings';

const printer: PrinterSettingsDto = {
  enabled: true,
  connection: 'Usb',
  printerName: 'POS-58',
  ipAddress: null,
  port: 9100,
  charsPerLine: 48,
  codePage: 858,
  openDrawerOnCashSale: true,
};

const receipt: ReceiptSettingsDto = {
  businessName: 'Mi Negocio',
  address: null,
  phone: null,
  taxId: null,
  headerLegend: null,
  footerMessage: null,
};

describe('PrinterSettings', () => {
  beforeEach(async () => {
    const configuration: Partial<ConfigurationService> = {
      getPrinter: () => of(printer),
      getReceipt: () => of(receipt),
      getAvailablePrinters: () => of(['POS-58', 'POS-80']),
      savePrinter: (body) => of(body),
      saveReceipt: (body) => of(body),
      testPrinter: () => of({ message: 'Ticket de prueba enviado a la impresora.' }),
    };

    await TestBed.configureTestingModule({
      imports: [PrinterSettings],
      providers: [{ provide: ConfigurationService, useValue: configuration }],
    }).compileComponents();
  });

  it('renders the printer and receipt sections without the paper-width toggle', () => {
    const fixture = TestBed.createComponent(PrinterSettings);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Impresora térmica');
    expect(text).toContain('Recibo');
    expect(text).toContain('Conexión');
    expect(text).not.toContain('58 mm');
    expect(text).not.toContain('80 mm');
  });

  it('toggles the cash drawer switch', () => {
    const fixture = TestBed.createComponent(PrinterSettings);
    fixture.detectChanges();
    const control = fixture.nativeElement.querySelector(
      'button[aria-label="Abrir cajón en venta en efectivo"]',
    ) as HTMLButtonElement;

    expect(control.getAttribute('aria-checked')).toBe('true');
    control.click();
    fixture.detectChanges();
    expect(control.getAttribute('aria-checked')).toBe('false');
  });

  it('sends a test print through the service', () => {
    const fixture = TestBed.createComponent(PrinterSettings);
    fixture.detectChanges();

    const test = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Probar impresión'))!;
    test.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ticket de prueba enviado');
  });
});
