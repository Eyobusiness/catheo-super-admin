import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { SuperAdminDashboardData } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiClient);

  /**
   * Récupère les indicateurs consolidés du tableau de bord Super Admin.
   * Endpoint réel : GET /api/v1/super-admin/dashboard
   */
  public getDashboardData(): Observable<SuperAdminDashboardData> {
    return this.api.get<SuperAdminDashboardData>('super-admin/dashboard').pipe(
      map((res) => res.data)
    );
  }
}
