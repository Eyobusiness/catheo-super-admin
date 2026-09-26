import { Routes } from '@angular/router';

export const ABONNEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/abonnement-list/abonnements-list-page.component').then(
        (m) => m.AbonnementsListPageComponent
      ),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('../pages/abonnement-create/abonnement-create-page.component').then(
        (m) => m.AbonnementCreatePageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/abonnement-detail/abonnement-detail-page.component').then(
        (m) => m.AbonnementDetailPageComponent
      ),
  },
];
