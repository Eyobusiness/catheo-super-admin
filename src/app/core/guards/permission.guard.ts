import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { PermissionService } from '../services/permission.service';
import { ToastService } from '../services/toast.service';

/**
 * Creates a route guard requiring a specific permission.
 */
export function requirePermission(permission: string): CanActivateFn {
  return () => {
    const sessionService = inject(SessionService);
    const permissionService = inject(PermissionService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    if (!sessionService.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    if (permissionService.hasPermission(permission)) {
      return true;
    }

    toastService.error(
      'Permission insuffisante',
      `Vous ne disposez pas de l'autorisation requise : [${permission}]`
    );
    return false;
  };
}

/**
 * Standard Permission Guard reading route data.
 * Usage in routes: canActivate: [permissionGuard], data: { permission: 'membres.manage' }
 */
export const permissionGuard: CanActivateFn = (route) => {
  const sessionService = inject(SessionService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!sessionService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const requiredPermission = route.data['permission'] as string | undefined;
  if (!requiredPermission) {
    return true;
  }

  if (permissionService.hasPermission(requiredPermission)) {
    return true;
  }

  toastService.error(
    'Permission insuffisante',
    `Action requise non autorisée : [${requiredPermission}]`
  );
  return false;
};
