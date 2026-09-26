import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { ToastService } from '../services/toast.service';

export const superAdminGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!sessionService.isAuthenticated()) {
    return router.createUrlTree(['/auth/admin']);
  }

  if (sessionService.isSuperAdmin()) {
    return true;
  }

  toastService.error(
    'Accès Refusé',
    'Cet espace est strictement réservé aux Super Administrateurs de la plateforme Cathéo.'
  );

  if (sessionService.isOrganisationUser()) {
    return router.createUrlTree(['/organisation/dashboard']);
  }

  return router.createUrlTree(['/mon-profil']);
};
