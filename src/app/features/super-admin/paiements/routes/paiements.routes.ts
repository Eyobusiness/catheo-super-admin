import { Routes } from '@angular/router';

export const PAIEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/paiements-list-page.component').then(
        (m) => m.PaiementsListPageComponent
      ),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('../pages/paiement-create-page.component').then(
        (m) => m.PaiementCreatePageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/paiement-detail-page.component').then(
        (m) => m.PaiementDetailPageComponent
      ),
  },
];
