import { Routes } from '@angular/router';

export const FORMULES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/formules-list-page.component').then(
        (m) => m.FormulesListPageComponent
      ),
  },
  {
    path: 'nouvelle',
    loadComponent: () =>
      import(
        '../pages/formule-create-page/formule-create-page.component'
      ).then((m) => m.FormuleCreatePageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import(
        '../pages/formule-detail-page/formule-detail-page.component'
      ).then((m) => m.FormuleDetailPageComponent),
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import(
        '../pages/formule-edit-page/formule-edit-page.component'
      ).then((m) => m.FormuleEditPageComponent),
  },
];
