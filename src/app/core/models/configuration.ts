// DTOs de la configuración del sistema (grupo /api/configuration del backend).
// El JSON viaja en camelCase. El dinero es decimal (pesos) y las tasas son
// porcentajes enteros/decimales (ej. IVA 16 = 16%).

// --- Negocio -------------------------------------------------------------

export interface BusinessProfileDto {
  id: number;
  commercialName: string;
  legalName: string;
  rfc: string;
  phone: string | null;
  email: string | null;
  fiscalAddress: string | null;
  logoUrl: string | null;
}

// El logotipo se administra aparte (POST/DELETE /business/logo), por eso no
// forma parte del cuerpo de guardado.
export interface SaveBusinessProfileRequest {
  commercialName: string;
  legalName: string;
  rfc: string;
  phone: string | null;
  email: string | null;
  fiscalAddress: string | null;
}

// --- Impuestos -----------------------------------------------------------

// ivaRate es el porcentaje entero (16 = 16%).
export interface TaxSettingsDto {
  applyIva: boolean;
  ivaRate: number;
}

export type SaveTaxSettingsRequest = TaxSettingsDto;

// --- Métodos de pago -----------------------------------------------------

// Configuración fija de los métodos soportados por el punto de venta.
// Los datos de tarjeta (banco/terminal) se comparten entre débito y crédito.
export interface PaymentSettingsDto {
  cashEnabled: boolean;
  debitCardEnabled: boolean;
  creditCardEnabled: boolean;
  bankTransferEnabled: boolean;
  cardBank: string | null;
  cardTerminalId: string | null;
  transferAccountNumber: string | null;
  transferAccountHolder: string | null;
}

export type SavePaymentSettingsRequest = PaymentSettingsDto;

// --- Impresora -----------------------------------------------------------

export type PrinterConnection = 'Usb' | 'Network';

export interface PrinterSettingsDto {
  enabled: boolean;
  connection: PrinterConnection;
  printerName: string | null;
  ipAddress: string | null;
  port: number;
  charsPerLine: number;
  codePage: number;
  openDrawerOnCashSale: boolean;
}

export type SavePrinterSettingsRequest = PrinterSettingsDto;

// Code pages aceptados por el backend (SavePrinterSettingsRequestValidator).
export const PRINTER_CODE_PAGES = [437, 850, 852, 858, 860, 863, 865, 866, 1252] as const;

// --- Recibo (encabezado / pie del ticket) --------------------------------

export interface ReceiptSettingsDto {
  businessName: string;
  address: string | null;
  phone: string | null;
  taxId: string | null;
  headerLegend: string | null;
  footerMessage: string | null;
}

export type SaveReceiptSettingsRequest = ReceiptSettingsDto;

// --- Respaldos -----------------------------------------------------------

// dailyTime tiene formato "HH:mm". lastRunAt es la marca del último respaldo.
export interface BackupSettingsDto {
  destinationDirectory: string;
  autoEnabled: boolean;
  dailyTime: string;
  retentionCount: number;
  lastRunAt: string | null;
}

export interface SaveBackupSettingsRequest {
  destinationDirectory: string;
  autoEnabled: boolean;
  dailyTime: string;
  retentionCount: number;
}

// Archivo de respaldo generado en el directorio destino del servidor.
export interface BackupFileDto {
  name: string;
  sizeBytes: number;
  createdAt: string;
}
