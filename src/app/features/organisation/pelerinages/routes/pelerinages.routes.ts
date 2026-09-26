import { Routes } from '@angular/router';

export const PELERINAGES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/pelerinages-list-page.component').then(
        (m) => m.PelerinagesListPageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/pelerinage-detail-page.component').then(
        (m) => m.PelerinageDetailPageComponent
      ),
  },
];
