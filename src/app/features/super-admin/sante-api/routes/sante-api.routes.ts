import { Routes } from '@angular/router';

export const SANTE_API_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/sante-api-page.component').then((m) => m.SanteApiPageComponent),
  },
];
