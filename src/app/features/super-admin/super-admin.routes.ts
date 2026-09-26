import { Routes } from '@angular/router';
import { SuperAdminLayoutComponent } from '../../layouts/super-admin-layout/super-admin-layout.component';

export const SUPER_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: SuperAdminLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/routes/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'paroisses',
        loadChildren: () =>
          import('./paroisses/routes/paroisses.routes').then((m) => m.PAROISSES_ROUTES),
      },
      {
        path: 'produits',
        loadChildren: () =>
          import('./produits/routes/produits.routes').then((m) => m.PRODUITS_ROUTES),
      },
      {
        path: 'formules',
        loadChildren: () =>
          import('./formules/routes/formules.routes').then((m) => m.FORMULES_ROUTES),
      },
      {
        path: 'abonnements',
        loadChildren: () =>
          import('./abonnements/routes/abonnements.routes').then((m) => m.ABONNEMENTS_ROUTES),
      },
      {
        path: 'paiements',
        loadChildren: () =>
          import('./paiements/routes/paiements.routes').then((m) => m.PAIEMENTS_ROUTES),
      },
      {
        path: 'factures',
        loadChildren: () =>
          import('./factures/routes/factures.routes').then((m) => m.FACTURES_ROUTES),
      },
      {
        path: 'echeances',
        loadChildren: () =>
          import('./paiements/routes/echeances.routes').then((m) => m.ECHEANCES_ROUTES),
      },
      {
        path: 'organisations',
        loadChildren: () =>
          import('./organisations/routes/organisations.routes').then((m) => m.ORGANISATIONS_ROUTES),
      },
      {
        path: 'utilisateurs',
        loadChildren: () =>
          import('./utilisateurs/routes/utilisateurs.routes').then((m) => m.UTILISATEURS_ROUTES),
      },
      {
        path: 'audit',
        loadChildren: () =>
          import('./audit/routes/audit.routes').then((m) => m.AUDIT_ROUTES),
      },
      {
        path: 'trash',
        loadChildren: () =>
          import('./trash/trash.routes').then((m) => m.TRASH_ROUTES),
      },
      {
        path: 'corbeille',
        redirectTo: 'trash',
        pathMatch: 'full',
      },
      {
        path: 'sante-api',
        loadChildren: () =>
          import('./sante-api/routes/sante-api.routes').then((m) => m.SANTE_API_ROUTES),
      },
    ],
  },
];
