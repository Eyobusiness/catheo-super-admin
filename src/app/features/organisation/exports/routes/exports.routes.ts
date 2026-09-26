import { Routes } from '@angular/router';

export const EXPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/exports-page.component').then((m) => m.ExportsPageComponent),
  },
];
