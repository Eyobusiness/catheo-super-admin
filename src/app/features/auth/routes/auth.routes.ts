import { Routes } from '@angular/router';
import { guestGuard } from '../../../core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'organisation',
    pathMatch: 'full',
  },
  {
    path: 'choice',
    redirectTo: 'organisation',
    pathMatch: 'full',
  },
  {
    path: 'login',
    redirectTo: 'organisation',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('../pages/admin-login-page/admin-login-page.component').then(
        (m) => m.AdminLoginPageComponent
      ),
    canActivate: [guestGuard],
    data: { title: 'Connexion Super Admin - Cathéo' },
  },
  {
    path: 'organisation',
    loadComponent: () =>
      import('../pages/organisation-login-page/organisation-login-page.component').then(
        (m) => m.OrganisationLoginPageComponent
      ),
    canActivate: [guestGuard],
    data: { title: 'Connexion Organisation - Cathéo' },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('../pages/forgot-password-page/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent
      ),
    canActivate: [guestGuard],
    data: { title: 'Mot de passe oublié - Cathéo' },
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('../pages/reset-password-page/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent
      ),
    canActivate: [guestGuard],
    data: { title: 'Réinitialisation du mot de passe - Cathéo' },
  },
];
