import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/organisation-dashboard-page.component').then(
        (m) => m.OrganisationDashboardPageComponent
      ),
  },
];
