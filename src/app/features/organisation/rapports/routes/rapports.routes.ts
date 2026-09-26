import { Routes } from '@angular/router';

export const RAPPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/rapports-page.component').then((m) => m.RapportsPageComponent),
  },
];
