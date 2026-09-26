import { Routes } from '@angular/router';

export const PAROISSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/paroisses-list-page.component').then(
        (m) => m.ParoissesListPageComponent
      ),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('../pages/paroisse-create-page/paroisse-create-page.component').then(
        (m) => m.ParoisseCreatePageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/paroisse-detail-page/paroisse-detail-page.component').then(
        (m) => m.ParoisseDetailPageComponent
      ),
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import('../pages/paroisse-edit-page/paroisse-edit-page.component').then(
        (m) => m.ParoisseEditPageComponent
      ),
  },
];
