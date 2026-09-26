import { Routes } from '@angular/router';

export const STATISTIQUES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/statistiques-page.component').then((m) => m.StatistiquesPageComponent),
  },
];
