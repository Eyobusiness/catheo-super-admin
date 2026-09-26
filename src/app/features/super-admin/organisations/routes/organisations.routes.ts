import { Routes } from '@angular/router';

export const ORGANISATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/organisations-list-page.component').then(
        (m) => m.OrganisationsListPageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/organisation-detail-page.component').then(
        (m) => m.OrganisationDetailPageComponent
      ),
  },
  {
    path: ':id/utilisateurs',
    loadComponent: () =>
      import('../pages/organisation-detail-page.component').then(
        (m) => m.OrganisationDetailPageComponent
      ),
  },
];
