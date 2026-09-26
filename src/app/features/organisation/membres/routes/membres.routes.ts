import { Routes } from '@angular/router';

export const MEMBRES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/membres-list-page.component').then((m) => m.MembresListPageComponent),
  },
];
