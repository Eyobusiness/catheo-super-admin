import { Routes } from '@angular/router';

export const SUPER_ADMIN_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/super-admin-dashboard-page.component').then(
        (m) => m.SuperAdminDashboardPageComponent
      ),
  },
];

export const DASHBOARD_ROUTES: Routes = SUPER_ADMIN_DASHBOARD_ROUTES;
