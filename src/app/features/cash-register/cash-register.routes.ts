import { Routes } from '@angular/router';

// Rutas de caja: apertura y cierre de turno + pantalla "Cierres" (historial + corte).
export const CASH_REGISTER_ROUTES: Routes = [
  { path: '', redirectTo: 'cierres', pathMatch: 'full' },
  {
    path: 'open',
    loadComponent: () => import('./open-register/open-register').then((m) => m.OpenRegister),
  },
  {
    path: 'close',
    loadComponent: () => import('./close-register/close-register').then((m) => m.CloseRegister),
  },
  {
    path: 'cierres',
    loadComponent: () =>
      import('./register-history/register-history').then((m) => m.RegisterHistory),
  },
];
