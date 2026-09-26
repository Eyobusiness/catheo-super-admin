import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models/auth.models';
import { OrganisationContext } from '../models/organisation.models';
import { Session } from '../models/api.models';

const TOKEN_KEY = 'catheo_saas_token';
const USER_KEY = 'catheo_saas_user';
const ORG_KEY = 'catheo_saas_org';
const MENUS_KEY = 'catheo_saas_menus';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  // Reactive signals (Angular 21)
  public readonly token = signal<string | null>(this.readStorage(TOKEN_KEY));
  public readonly currentUser = signal<User | null>(this.readJsonStorage<User>(USER_KEY));
  public readonly currentOrganisation = signal<OrganisationContext | null>(
    this.readJsonStorage<OrganisationContext>(ORG_KEY)
  );
  public readonly accessibleMenus = signal<any[]>(this.readJsonStorage<any[]>(MENUS_KEY) || []);

  // Computed state
  public readonly isAuthenticated = computed<boolean>(() => !!this.token());

  public readonly isSuperAdmin = computed<boolean>(() => {
    const user = this.currentUser();
    if (!user) return false;
    if (user.user_type === 'super_admin') return true;
    if (user.profil?.code === 'SUPER_ADMIN') return true;
    const permissions = (user.profil?.permissions as string[]) || [];
    return permissions.includes('*') && !user.paroisse_configuration_id;
  });

  public readonly isOrganisationUser = computed<boolean>(() => {
    const user = this.currentUser();
    return !!user && !!user.organisation_id;
  });

  public readonly organisationType = computed<string | null>(() => {
    return this.currentOrganisation()?.type_organisation || null;
  });

  public readonly sessionSnapshot = computed<Session>(() => ({
    token: this.token(),
    user: this.currentUser(),
    organisation: this.currentOrganisation(),
    menus: this.accessibleMenus(),
    lastActivityAt: Date.now(),
  }));

  /**
   * Initializes or refreshes the user session in reactive signals and localStorage.
   */
  public setSession(
    token: string,
    user: User,
    menus: any[] = [],
    organisation: OrganisationContext | null = null
  ): void {
    this.token.set(token);
    this.currentUser.set(user);
    this.accessibleMenus.set(menus);

    this.writeStorage(TOKEN_KEY, token);
    this.writeJsonStorage(USER_KEY, user);
    this.writeJsonStorage(MENUS_KEY, menus);

    if (organisation) {
      this.currentOrganisation.set(organisation);
      this.writeJsonStorage(ORG_KEY, organisation);
    }
  }

  /**
   * Updates only the user profile in active session.
   */
  public updateUser(user: User): void {
    this.currentUser.set(user);
    this.writeJsonStorage(USER_KEY, user);
  }

  /**
   * Updates the organisation context in active session.
   */
  public updateOrganisation(org: OrganisationContext | null): void {
    this.currentOrganisation.set(org);
    if (org) {
      this.writeJsonStorage(ORG_KEY, org);
    } else {
      this.removeStorage(ORG_KEY);
    }
  }

  /**
   * Cleans all session tokens and data from signals and storage.
   */
  public clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.currentOrganisation.set(null);
    this.accessibleMenus.set([]);

    this.removeStorage(TOKEN_KEY);
    this.removeStorage(USER_KEY);
    this.removeStorage(ORG_KEY);
    this.removeStorage(MENUS_KEY);
  }

  private readStorage(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch {
      // Storage access blocked or unavailable
    }
    return null;
  }

  private readJsonStorage<T>(key: string): T | null {
    const raw = this.readStorage(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch {
      // Storage access blocked or quota exceeded
    }
  }

  private writeJsonStorage(key: string, value: any): void {
    this.writeStorage(key, JSON.stringify(value));
  }

  private removeStorage(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch {
      // Storage access blocked or unavailable
    }
  }
}
