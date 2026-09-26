import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_ORGANISATION_SPACE,
  ORGANISATION_SPACES,
  OrganisationSpace,
} from '../models/organisation-space.model';
import {
  ORGANISATION_PREFERENCE_STORAGE_KEY,
  isValidOrganisationType,
} from '../../../core/constants/organisation.constants';

export const ORGANISATION_SPACE_PREF_KEY = ORGANISATION_PREFERENCE_STORAGE_KEY;

/**
 * Service de gestion de la préférence d'espace organisationnel (OPPE / OPPJ / OPPA).
 * 
 * IMPORTANT : Cette mémoire en localStorage est STRICTEMENT une préférence d'interface utilisateur (UI).
 * Elle ne confère aucun droit, token ou permission.
 * Le backend Laravel reste la SEULE source de vérité pour déterminer l'organisation
 * et les accès réels après authentification.
 */
@Injectable({
  providedIn: 'root',
})
export class OrganisationSpacePreferenceService {
  /**
   * Signal réactif exposant la préférence courante.
   */
  public readonly currentPreference = signal<OrganisationSpace>(this.getPreference());

  /**
   * Indique si l'utilisateur a déjà effectué un choix explicite mémorisé.
   * Sert à conditionner l'affichage de la popup lors de la toute première visite.
   */
  public hasPreference(): boolean {
    const value = this.readStorage();
    return value !== null && this.isValidSpace(value);
  }

  /**
   * Retourne l'espace mémorisé, ou l'espace par défaut (OPPE) si aucun choix n'est mémorisé.
   */
  public getPreference(): OrganisationSpace {
    const value = this.readStorage();
    if (value && this.isValidSpace(value)) {
      return value as OrganisationSpace;
    }
    return DEFAULT_ORGANISATION_SPACE;
  }

  /**
   * Enregistre le choix d'espace en localStorage et met à jour le signal réactif.
   */
  public setPreference(space: OrganisationSpace): void {
    if (this.isValidSpace(space)) {
      this.writeStorage(space);
      this.currentPreference.set(space);
    }
  }

  /**
   * Réinitialise la préférence stockée.
   */
  public resetPreference(): void {
    this.removeStorage();
    this.currentPreference.set(DEFAULT_ORGANISATION_SPACE);
  }

  private isValidSpace(value: string): boolean {
    return isValidOrganisationType(value) && Object.prototype.hasOwnProperty.call(ORGANISATION_SPACES, value);
  }

  private readStorage(): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(ORGANISATION_SPACE_PREF_KEY);
      }
    } catch {
      // Storage access disabled or unavailable in context
    }
    return null;
  }

  private writeStorage(value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ORGANISATION_SPACE_PREF_KEY, value);
      }
    } catch {
      // Quota exceeded or storage disabled
    }
  }

  private removeStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(ORGANISATION_SPACE_PREF_KEY);
      }
    } catch {
      // Storage access disabled
    }
  }
}
