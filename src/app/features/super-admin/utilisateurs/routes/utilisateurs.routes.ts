import { Routes } from '@angular/router';

export const UTILISATEURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/utilisateurs-list-page.component').then((m) => m.UtilisateursListPageComponent),
  },
];
