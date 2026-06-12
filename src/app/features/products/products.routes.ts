import { Routes } from '@angular/router';

// TODO: agregar rutas de new, :id/edit y categories cuando existan las vistas.
export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./product-list/product-list').then((m) => m.ProductList),
  },
];
