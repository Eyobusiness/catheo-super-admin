import { Routes } from '@angular/router';

export const FACTURES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/factures-list-page.component').then(
        (m) => m.FacturesListPageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/facture-detail-page.component').then(
        (m) => m.FactureDetailPageComponent
      ),
  },
];
