import { Routes } from '@angular/router';
import { OrganisationLayoutComponent } from '../../layouts/organisation-layout/organisation-layout.component';

export const ORGANISATION_ROUTES: Routes = [
  {
    path: '',
    component: OrganisationLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      // 1. Dashboard
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/routes/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      // 2. Membres du bureau
      {
        path: 'membres',
        loadChildren: () =>
          import('./membres/routes/membres.routes').then((m) => m.MEMBRES_ROUTES),
      },
      // 3. Activités pastorales
      {
        path: 'activites',
        loadChildren: () =>
          import('./activites/routes/activites.routes').then((m) => m.ACTIVITES_ROUTES),
      },
      // 4. Campagnes de pèlerinage
      {
        path: 'pelerinages',
        loadChildren: () =>
          import('./pelerinages/routes/pelerinages.routes').then((m) => m.PELERINAGES_ROUTES),
      },
      // 5. Tarifs
      {
        path: 'tarifs',
        loadComponent: () =>
          import('./tarifs/pages/tarifs-page.component').then((m) => m.TarifsPageComponent),
        data: { title: 'Tarifs des Pèlerinages - Cathéo' },
      },
      // 6. Inscriptions directes (redirige vers participants pour fusion)
      {
        path: 'inscriptions',
        redirectTo: 'participants',
        pathMatch: 'full',
      },
      // 7. Registre des participants
      {
        path: 'participants',
        loadComponent: () =>
          import('./participants/pages/participants-page.component').then(
            (m) => m.ParticipantsPageComponent
          ),
        data: { title: 'Registre des Participants - Cathéo' },
      },
      // 8. Caisse pastorale
      {
        path: 'caisse',
        loadChildren: () =>
          import('./caisse/routes/caisse.routes').then((m) => m.CAISSE_ROUTES),
      },
      // 9. Règlements & Paiements
      {
        path: 'paiements',
        loadComponent: () =>
          import('./paiements/pages/paiements-page.component').then(
            (m) => m.PaiementsPageComponent
          ),
        data: { title: 'Journal des Paiements - Cathéo' },
      },
      // 10. Statistiques
      {
        path: 'statistiques',
        loadChildren: () =>
          import('./statistiques/routes/statistiques.routes').then((m) => m.STATISTIQUES_ROUTES),
      },
      // 11. Informations de l'organisation
      {
        path: 'informations',
        loadComponent: () =>
          import('./informations/pages/organisation-info-page.component').then(
            (m) => m.OrganisationInfoPageComponent
          ),
        data: { title: 'Informations Organisation - Cathéo' },
      },
      // 12. Utilisateurs & Rôles
      {
        path: 'utilisateurs',
        loadComponent: () =>
          import('./utilisateurs/pages/organisation-users-page.component').then(
            (m) => m.OrganisationUsersPageComponent
          ),
        data: { title: 'Utilisateurs & Rôles - Cathéo' },
      },
      // 13. Historique & Audit
      {
        path: 'historique',
        loadComponent: () =>
          import('./historique/pages/organisation-historique-page.component').then(
            (m) => m.OrganisationHistoriquePageComponent
          ),
        data: { title: 'Journal & Historique Interne - Cathéo' },
      },
      // Rapports & Exports
      {
        path: 'rapports',
        loadChildren: () =>
          import('./rapports/routes/rapports.routes').then((m) => m.RAPPORTS_ROUTES),
      },
      {
        path: 'exports',
        loadChildren: () =>
          import('./exports/routes/exports.routes').then((m) => m.EXPORTS_ROUTES),
      },
      // Passerelle CATHEO
      {
        path: 'catheo',
        loadChildren: () =>
          import('./catheo-population/routes/catheo-population.routes').then(
            (m) => m.CATHEO_POPULATION_ROUTES
          ),
      },
      {
        path: 'catheo-population',
        loadChildren: () =>
          import('./catheo-population/routes/catheo-population.routes').then(
            (m) => m.CATHEO_POPULATION_ROUTES
          ),
      },
      // Alias
      {
        path: 'oppe',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'oppj',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'oppa',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
