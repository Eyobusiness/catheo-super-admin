import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/dashboard-page.component').then(
        (m) => m.DashboardPageComponent
      ),
  },
];

export const SUPER_ADMIN_DASHBOARD_ROUTES: Routes = DASHBOARD_ROUTES;
