import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const guestGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!sessionService.isAuthenticated()) {
    return true;
  }

  if (sessionService.isSuperAdmin()) {
    return router.createUrlTree(['/super-admin/dashboard']);
  }

  if (sessionService.isOrganisationUser()) {
    return router.createUrlTree(['/organisation/dashboard']);
  }

  return router.createUrlTree(['/mon-profil']);
};
