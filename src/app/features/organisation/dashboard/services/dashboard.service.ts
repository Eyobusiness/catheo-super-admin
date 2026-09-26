import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import { OrganisationDashboardData } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class OrganisationDashboardService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'organisation/dashboard';

  /**
   * Récupère le tableau de bord consolidé de l'organisation.
   * @param fresh Si true, force le recalcul en contournant le cache serveur de 120 secondes.
   */
  public getDashboard(fresh: boolean = false): Observable<OrganisationDashboardData> {
    const params = fresh ? { fresh: true } : undefined;
    return this.api
      .get<OrganisationDashboardData>(this.endpoint, { params })
      .pipe(map((res) => res.data));
  }
}
