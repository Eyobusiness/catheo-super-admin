import { Routes } from '@angular/router';

export const CATHEO_POPULATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/catheo-population-page.component').then((m) => m.CatheoPopulationPageComponent),
  },
];
