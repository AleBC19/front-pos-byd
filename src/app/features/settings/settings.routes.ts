import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings-layout/settings-layout').then((m) => m.SettingsLayout),
    children: [
      { path: '', redirectTo: 'printer', pathMatch: 'full' },
      {
        path: 'business',
        loadComponent: () => import('./business/business-settings').then((m) => m.BusinessSettings),
      },
      {
        path: 'taxes',
        loadComponent: () => import('./taxes/tax-settings').then((m) => m.TaxSettings),
      },
      {
        path: 'printer',
        loadComponent: () => import('./printer/printer-settings').then((m) => m.PrinterSettings),
      },
      {
        path: 'payment-methods',
        loadComponent: () =>
          import('./payment-methods/payment-methods-settings').then(
            (m) => m.PaymentMethodsSettings,
          ),
      },
      {
        path: 'backup',
        loadComponent: () => import('./backup/backup-settings').then((m) => m.BackupSettings),
      },
    ],
  },
];
