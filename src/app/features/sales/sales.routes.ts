import { Routes } from '@angular/router';

// Por ahora solo la pantalla de Nueva Venta (POS).
// TODO: history, history/:id y returns cuando se implementen sus vistas.
export const SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./new-sale/new-sale').then((m) => m.NewSale),
  },
];
