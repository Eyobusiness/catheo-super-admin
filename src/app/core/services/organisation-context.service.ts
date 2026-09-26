import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { SessionService } from './session.service';
import { ToastService } from './toast.service';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api.models';
import { OrganisationContext } from '../models/organisation.models';
import {
  OrganisationType,
  getSectionsForOrganisationType,
} from '../constants/organisation.constants';

@Injectable({
  providedIn: 'root',
})
export class OrganisationContextService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly endpoint = `${this.apiBaseUrl}/organisation`;

  public readonly isContextLoading = signal<boolean>(false);

  // Reactive context delegated from SessionService
  public readonly context = computed<OrganisationContext | null>(() => {
    return this.sessionService.currentOrganisation();
  });

  public readonly paroisse = computed(() => {
    return this.context()?.paroisse || null;
  });

  public readonly typeOrganisation = computed<OrganisationType | null>(() => {
    return (this.context()?.type_organisation as OrganisationType) || null;
  });

  public readonly isOppe = computed<boolean>(() => {
    return this.typeOrganisation() === 'OPPE';
  });

  public readonly isOppj = computed<boolean>(() => {
    return this.typeOrganisation() === 'OPPJ';
  });

  public readonly isOppa = computed<boolean>(() => {
    return this.typeOrganisation() === 'OPPA';
  });

  public readonly targetSectionCodes = computed<readonly string[]>(() => {
    const type = this.typeOrganisation();
    return type ? getSectionsForOrganisationType(type) : [];
  });

  public readonly isActive = computed<boolean>(() => {
    return this.context()?.statut === 'actif';
  });

  public readonly hasCatheoAccess = computed<boolean>(() => {
    return !!this.context()?.paroisse?.nom_paroisse;
  });

  /**
   * Fetches certified organisation context from server (/api/v1/organisation/context).
   * Note: The server determines tenant context strictly from the Sanctum token.
   */
  public loadContext(): Observable<OrganisationContext | null> {
    this.isContextLoading.set(true);
    return this.http.get<ApiResponse<OrganisationContext>>(`${this.endpoint}/context`).pipe(
      map((res) => res.data),
      tap((data) => {
        this.isContextLoading.set(false);
        if (data) {
          this.sessionService.updateOrganisation(data);
        }
      }),
      catchError(() => {
        this.isContextLoading.set(false);
        return of(null);
      })
    );
  }

  /**
   * Fetches organisation general information (/api/v1/organisation/info).
   */
  public getInfo(): Observable<OrganisationContext | null> {
    return this.http.get<ApiResponse<OrganisationContext>>(`${this.endpoint}/info`).pipe(
      map((res) => res.data),
      catchError(() => of(null))
    );
  }

  /**
   * Updates organisation general information (/api/v1/organisation/info).
   */
  public updateInfo(payload: Partial<OrganisationContext>): Observable<OrganisationContext | null> {
    return this.http.put<ApiResponse<OrganisationContext>>(`${this.endpoint}/info`, payload).pipe(
      map((res) => res.data),
      tap((updated) => {
        if (updated) {
          this.sessionService.updateOrganisation(updated);
          this.toastService.success('Organisation', 'Informations mises à jour avec succès.');
        }
      })
    );
  }
}
