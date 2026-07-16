import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError, extractApiError } from '../../../core/models/api';
import {
  PRINTER_CODE_PAGES,
  PrinterConnection,
  PrinterSettingsDto,
  ReceiptSettingsDto,
  SavePrinterSettingsRequest,
  SaveReceiptSettingsRequest,
} from '../../../core/models/configuration';
import { ConfigurationService } from '../../../core/services/configuration-service';

interface TestResult {
  message: string;
  ok: boolean;
}

// Configuración de impresora térmica y recibo, conectada a
// /api/configuration/printer (+ /printer/available, /printer/test) y
// /api/configuration/receipt.
@Component({
  selector: 'app-printer-settings',
  templateUrl: './printer-settings.html',
  imports: [ReactiveFormsModule],
})
export class PrinterSettings {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly configuration = inject(ConfigurationService);

  protected readonly codePages = PRINTER_CODE_PAGES;

  protected readonly loading = signal(true);
  protected readonly savingPrinter = signal(false);
  protected readonly savingReceipt = signal(false);
  protected readonly testing = signal(false);
  protected readonly printerSaved = signal(false);
  protected readonly receiptSaved = signal(false);
  protected readonly printerError = signal<ApiError | null>(null);
  protected readonly receiptError = signal<ApiError | null>(null);
  protected readonly testResult = signal<TestResult | null>(null);
  protected readonly availablePrinters = signal<string[]>([]);

  private pending = 2;

  protected readonly printerForm = this.fb.group({
    enabled: [true],
    connection: ['Usb' as PrinterConnection],
    printerName: ['', [Validators.maxLength(200)]],
    ipAddress: [''],
    port: [9100, [Validators.required, Validators.min(1), Validators.max(65535)]],
    charsPerLine: [48, [Validators.required, Validators.min(1), Validators.max(96)]],
    codePage: [858, [Validators.required]],
    openDrawerOnCashSale: [false],
  });

  protected readonly receiptForm = this.fb.group({
    businessName: ['', [Validators.required, Validators.maxLength(120)]],
    address: ['', [Validators.maxLength(200)]],
    phone: ['', [Validators.maxLength(30)]],
    taxId: ['', [Validators.maxLength(20)]],
    headerLegend: ['', [Validators.maxLength(200)]],
    footerMessage: ['', [Validators.maxLength(200)]],
  });

  // Signal de la conexión seleccionada para mostrar los campos correctos.
  protected readonly connection = toSignal(this.printerForm.controls.connection.valueChanges, {
    initialValue: this.printerForm.controls.connection.value,
  });

  constructor() {
    this.load();
  }

  protected setConnection(connection: PrinterConnection): void {
    this.printerForm.controls.connection.setValue(connection);
    this.syncPrinterValidators();
    this.printerSaved.set(false);
  }

  protected toggle(control: 'enabled' | 'openDrawerOnCashSale'): void {
    const target = this.printerForm.controls[control];
    target.setValue(!target.value);
    this.printerSaved.set(false);
  }

  protected invalidPrinter(controlName: string): boolean {
    const control = this.printerForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected invalidReceipt(controlName: string): boolean {
    const control = this.receiptForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected savePrinter(): void {
    this.syncPrinterValidators();

    if (this.printerForm.invalid) {
      this.printerForm.markAllAsTouched();
      return;
    }

    const value = this.printerForm.getRawValue();
    const body: SavePrinterSettingsRequest = {
      enabled: value.enabled,
      connection: value.connection,
      printerName: value.printerName.trim() || null,
      ipAddress: value.ipAddress.trim() || null,
      port: value.port,
      charsPerLine: value.charsPerLine,
      codePage: value.codePage,
      openDrawerOnCashSale: value.openDrawerOnCashSale,
    };

    this.savingPrinter.set(true);
    this.printerSaved.set(false);
    this.printerError.set(null);

    this.configuration.savePrinter(body).subscribe({
      next: (settings) => {
        this.savingPrinter.set(false);
        this.printerSaved.set(true);
        this.applyPrinter(settings);
      },
      error: (err) => {
        this.savingPrinter.set(false);
        this.printerError.set(extractApiError(err));
      },
    });
  }

  protected saveReceipt(): void {
    if (this.receiptForm.invalid) {
      this.receiptForm.markAllAsTouched();
      return;
    }

    const value = this.receiptForm.getRawValue();
    const body: SaveReceiptSettingsRequest = {
      businessName: value.businessName.trim(),
      address: value.address.trim() || null,
      phone: value.phone.trim() || null,
      taxId: value.taxId.trim() || null,
      headerLegend: value.headerLegend.trim() || null,
      footerMessage: value.footerMessage.trim() || null,
    };

    this.savingReceipt.set(true);
    this.receiptSaved.set(false);
    this.receiptError.set(null);

    this.configuration.saveReceipt(body).subscribe({
      next: (settings) => {
        this.savingReceipt.set(false);
        this.receiptSaved.set(true);
        this.applyReceipt(settings);
      },
      error: (err) => {
        this.savingReceipt.set(false);
        this.receiptError.set(extractApiError(err));
      },
    });
  }

  protected testPrint(): void {
    this.testing.set(true);
    this.testResult.set(null);

    this.configuration.testPrinter().subscribe({
      next: (result) => {
        this.testing.set(false);
        this.testResult.set({ message: result.message, ok: true });
      },
      error: (err) => {
        this.testing.set(false);
        this.testResult.set({ message: extractApiError(err).message, ok: false });
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.printerError.set(null);
    this.receiptError.set(null);

    this.configuration.getPrinter().subscribe({
      next: (settings) => {
        this.applyPrinter(settings);
        this.settle();
      },
      error: (err) => {
        this.printerError.set(extractApiError(err));
        this.settle();
      },
    });

    this.configuration.getReceipt().subscribe({
      next: (settings) => {
        this.applyReceipt(settings);
        this.settle();
      },
      error: (err) => {
        this.receiptError.set(extractApiError(err));
        this.settle();
      },
    });

    this.configuration.getAvailablePrinters().subscribe({
      next: (printers) => this.availablePrinters.set(printers),
      error: () => this.availablePrinters.set([]),
    });
  }

  private settle(): void {
    this.pending -= 1;
    if (this.pending <= 0) this.loading.set(false);
  }

  private applyPrinter(settings: PrinterSettingsDto): void {
    this.printerForm.reset({
      enabled: settings.enabled,
      connection: settings.connection,
      printerName: settings.printerName ?? '',
      ipAddress: settings.ipAddress ?? '',
      port: settings.port,
      charsPerLine: settings.charsPerLine,
      codePage: settings.codePage,
      openDrawerOnCashSale: settings.openDrawerOnCashSale,
    });
    this.syncPrinterValidators();
  }

  private applyReceipt(settings: ReceiptSettingsDto): void {
    this.receiptForm.reset({
      businessName: settings.businessName,
      address: settings.address ?? '',
      phone: settings.phone ?? '',
      taxId: settings.taxId ?? '',
      headerLegend: settings.headerLegend ?? '',
      footerMessage: settings.footerMessage ?? '',
    });
  }

  // printerName es obligatorio con conexión USB; ipAddress con conexión de red
  // (SavePrinterSettingsRequestValidator del backend).
  private syncPrinterValidators(): void {
    const usb = this.printerForm.controls.connection.value === 'Usb';

    const printerName = this.printerForm.controls.printerName;
    printerName.setValidators(
      usb ? [Validators.required, Validators.maxLength(200)] : [Validators.maxLength(200)],
    );
    printerName.updateValueAndValidity({ emitEvent: false });

    const ipAddress = this.printerForm.controls.ipAddress;
    ipAddress.setValidators(usb ? [] : [Validators.required]);
    ipAddress.updateValueAndValidity({ emitEvent: false });
  }
}
