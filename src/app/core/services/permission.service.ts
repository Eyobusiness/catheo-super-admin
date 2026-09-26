import { Injectable, computed, inject } from '@angular/core';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly sessionService = inject(SessionService);

  // Active permissions list from the logged-in user profile
  public readonly permissions = computed<string[]>(() => {
    const user = this.sessionService.currentUser();
    if (!user) return [];
    if (this.sessionService.isSuperAdmin()) {
      return ['*'];
    }
    return user.profil?.permissions || [];
  });

  public readonly isSuperAdmin = computed<boolean>(() => {
    return this.sessionService.isSuperAdmin();
  });

  public readonly isResponsable = computed<boolean>(() => {
    const user = this.sessionService.currentUser();
    if (!user) return false;
    const code = user.profil?.code || '';
    return code.startsWith('RESPONSABLE_') || code === 'SUPER_ADMIN';
  });

  public readonly isAnimateur = computed<boolean>(() => {
    const user = this.sessionService.currentUser();
    if (!user) return false;
    const code = user.profil?.code || '';
    return code.startsWith('UTILISATEUR_') || code.startsWith('ANIMATEUR_');
  });

  /**
   * Checks if the active user possesses a specific permission.
   * Super Admin (`*`) automatically passes all checks.
   */
  public hasPermission(permission: string): boolean {
    if (!permission) return true;
    const list = this.permissions();
    if (list.includes('*')) return true;
    if (list.includes(permission)) return true;

    // Support domain .manage (e.g. activites.manage implies activites.view, activites.read, activites.create, etc.)
    const parts = permission.split('.');
    if (parts.length > 1) {
      const domain = parts[0];
      const action = parts[1];
      if (list.includes(`${domain}.manage`) || list.includes(`${domain}.*`)) {
        return true;
      }
      // view <-> read equivalence
      if (action === 'view' && list.includes(`${domain}.read`)) return true;
      if (action === 'read' && list.includes(`${domain}.view`)) return true;
    }

    return false;
  }

  /**
   * Checks if the active user possesses at least one of the listed permissions.
   */
  public hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * Checks if the active user possesses all of the listed permissions.
   */
  public hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every((p) => this.hasPermission(p));
  }

  /**
   * Verifies if the organisation is allowed to access a specific Catheo section.
   * Enforces backend section cloisonnement rules:
   * - OPPE: SEC-ENFANTS-PRI, SEC-ENFANTS-COL
   * - OPPJ: SEC-JEUNES
   * - OPPA: SEC-ADULTES
   */
  public canAccessSection(sectionCode: string): boolean {
    if (this.isSuperAdmin()) return true;

    const orgType = this.sessionService.organisationType();
    if (!orgType) return false;

    if (orgType === 'OPPE') {
      return sectionCode === 'SEC-ENFANTS-PRI' || sectionCode === 'SEC-ENFANTS-COL';
    }

    if (orgType === 'OPPJ') {
      return sectionCode === 'SEC-JEUNES';
    }

    if (orgType === 'OPPA') {
      return sectionCode === 'SEC-ADULTES';
    }

    return false;
  }
}
