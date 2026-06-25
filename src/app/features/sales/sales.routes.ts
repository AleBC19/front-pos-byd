import { Routes } from '@angular/router';

// Rutas del módulo de ventas: punto de venta, historial (con detalle) y devoluciones.
export const SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./new-sale/new-sale').then((m) => m.NewSale),
  },
  {
    path: 'history',
    loadComponent: () => import('./sale-history/sale-history').then((m) => m.SaleHistory),
  },
  {
    path: 'returns',
    loadComponent: () =>
      import('./returns-history/returns-history').then((m) => m.ReturnsHistory),
  },
];
