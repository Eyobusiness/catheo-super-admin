import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { organisationGuard } from './core/guards/organisation.guard';

export const routes: Routes = [
  // Authentification (Login, Forgot password, Reset password)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/routes/auth.routes').then((m) => m.AUTH_ROUTES)
  },

  // Profil personnel
  {
    path: 'mon-profil',
    loadComponent: () =>
      import('./features/auth/pages/mon-profil/mon-profil-page.component').then(
        (m) => m.MonProfilPageComponent
      ),
    canActivate: [authGuard],
    data: { title: 'Mon Profil - Cathéo' }
  },

  // Espace Super Admin
  {
    path: 'super-admin',
    canActivate: [superAdminGuard],
    loadChildren: () =>
      import('./features/super-admin/super-admin.routes').then(
        (m) => m.SUPER_ADMIN_ROUTES
      ),
    data: { title: 'Super Admin - Cathéo' }
  },

  // Espace Organisations (OPPE, OPPJ, OPPA)
  {
    path: 'organisation',
    canActivate: [organisationGuard],
    loadChildren: () =>
      import('./features/organisation/organisation.routes').then(
        (m) => m.ORGANISATION_ROUTES
      ),
    data: { title: 'Organisation - Cathéo' }
  },

  // Redirection par défaut
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/organisation',
  },
  {
    path: '**',
    redirectTo: 'auth/organisation',
  },
];
