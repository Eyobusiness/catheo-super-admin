import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { ToastService } from '../services/toast.service';

export const organisationGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!sessionService.isAuthenticated()) {
    return router.createUrlTree(['/auth/organisation']);
  }

  // Super Admin can inspect organisation space, or organisation member
  if (sessionService.isSuperAdmin() || sessionService.isOrganisationUser()) {
    return true;
  }

  toastService.error(
    'Accès Refusé',
    "Votre compte n'est rattaché à aucune organisation paroissiale active."
  );

  return router.createUrlTree(['/mon-profil']);
};
