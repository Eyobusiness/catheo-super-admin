import { Routes } from '@angular/router';

export const ECHEANCES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/echeances-list-page.component').then(
        (m) => m.EcheancesListPageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/echeance-detail-page.component').then(
        (m) => m.EcheanceDetailPageComponent
      ),
  },
];
