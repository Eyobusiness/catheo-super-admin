import { Routes } from '@angular/router';

export const ACTIVITES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/activites-list-page.component').then((m) => m.ActivitesListPageComponent),
  },
];
