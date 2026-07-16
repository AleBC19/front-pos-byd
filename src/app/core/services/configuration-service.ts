import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BackupFileDto,
  BackupSettingsDto,
  BusinessProfileDto,
  PaymentSettingsDto,
  PrinterSettingsDto,
  ReceiptSettingsDto,
  SaveBackupSettingsRequest,
  SaveBusinessProfileRequest,
  SavePaymentSettingsRequest,
  SavePrinterSettingsRequest,
  SaveReceiptSettingsRequest,
  SaveTaxSettingsRequest,
  TaxSettingsDto,
} from '../models/configuration';

// Configuración del sistema contra /api/configuration (requiere permiso
// configurar_sistema). Servicio sin estado: los componentes guardan los
// resultados en sus propias signals.
@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/configuration`;

  // --- Negocio -----------------------------------------------------------

  getBusiness(): Observable<BusinessProfileDto> {
    return this.http.get<BusinessProfileDto>(`${this.baseUrl}/business`);
  }

  saveBusiness(body: SaveBusinessProfileRequest): Observable<BusinessProfileDto> {
    return this.http.put<BusinessProfileDto>(`${this.baseUrl}/business`, body);
  }

  // Sube (o reemplaza) el logotipo. multipart/form-data con el campo "file";
  // el navegador arma el boundary y el authInterceptor solo agrega Authorization.
  uploadLogo(file: File): Observable<BusinessProfileDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BusinessProfileDto>(`${this.baseUrl}/business/logo`, formData);
  }

  deleteLogo(): Observable<BusinessProfileDto> {
    return this.http.delete<BusinessProfileDto>(`${this.baseUrl}/business/logo`);
  }

  // --- Impuestos ---------------------------------------------------------

  getTaxes(): Observable<TaxSettingsDto> {
    return this.http.get<TaxSettingsDto>(`${this.baseUrl}/taxes`);
  }

  saveTaxes(body: SaveTaxSettingsRequest): Observable<TaxSettingsDto> {
    return this.http.put<TaxSettingsDto>(`${this.baseUrl}/taxes`, body);
  }

  // --- Métodos de pago ---------------------------------------------------

  getPaymentSettings(): Observable<PaymentSettingsDto> {
    return this.http.get<PaymentSettingsDto>(`${this.baseUrl}/payment-methods`);
  }

  savePaymentSettings(body: SavePaymentSettingsRequest): Observable<PaymentSettingsDto> {
    return this.http.put<PaymentSettingsDto>(`${this.baseUrl}/payment-methods`, body);
  }

  // --- Impresora ---------------------------------------------------------

  getPrinter(): Observable<PrinterSettingsDto> {
    return this.http.get<PrinterSettingsDto>(`${this.baseUrl}/printer`);
  }

  savePrinter(body: SavePrinterSettingsRequest): Observable<PrinterSettingsDto> {
    return this.http.put<PrinterSettingsDto>(`${this.baseUrl}/printer`, body);
  }

  // Nombres de las impresoras instaladas en el equipo (Windows).
  getAvailablePrinters(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/printer/available`);
  }

  // Envía un ticket de prueba a la impresora configurada.
  testPrinter(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/printer/test`, {});
  }

  // --- Recibo ------------------------------------------------------------

  getReceipt(): Observable<ReceiptSettingsDto> {
    return this.http.get<ReceiptSettingsDto>(`${this.baseUrl}/receipt`);
  }

  saveReceipt(body: SaveReceiptSettingsRequest): Observable<ReceiptSettingsDto> {
    return this.http.put<ReceiptSettingsDto>(`${this.baseUrl}/receipt`, body);
  }

  // --- Respaldos ---------------------------------------------------------

  getBackupSettings(): Observable<BackupSettingsDto> {
    return this.http.get<BackupSettingsDto>(`${this.baseUrl}/backups/settings`);
  }

  saveBackupSettings(body: SaveBackupSettingsRequest): Observable<BackupSettingsDto> {
    return this.http.put<BackupSettingsDto>(`${this.baseUrl}/backups/settings`, body);
  }

  // Crea un respaldo ahora y devuelve el archivo generado.
  createBackup(): Observable<BackupFileDto> {
    return this.http.post<BackupFileDto>(`${this.baseUrl}/backups`, {});
  }

  listBackups(): Observable<BackupFileDto[]> {
    return this.http.get<BackupFileDto[]>(`${this.baseUrl}/backups`);
  }
}
