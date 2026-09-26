import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse, PaginatedMeta } from '../../../../core/models/api.models';
import { AuditFilters, AuditLog } from '../models/audit.model';

export interface AuditLogPaginatedResponse {
  data: AuditLog[];
  meta: PaginatedMeta;
}

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'super-admin/audit-logs';

  /**
   * GET /api/v1/super-admin/audit-logs
   */
  public getAuditLogs(filters?: AuditFilters): Observable<AuditLogPaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (filters) {
      if (filters.action && filters.action !== 'tous') {
        queryParams['action'] = filters.action;
      }
      if (filters.entite_type && filters.entite_type !== 'toutes') {
        queryParams['entite_type'] = filters.entite_type;
      }
      if (filters.module) {
        queryParams['module'] = filters.module;
      }
      if (filters.user_id) {
        queryParams['user_id'] = filters.user_id;
      }
      if (filters.search) {
        queryParams['search'] = filters.search;
      }
      if (filters.periode) {
        queryParams['periode'] = filters.periode;
      }
      if (filters.page) {
        queryParams['page'] = filters.page;
      }
      if (filters.per_page) {
        queryParams['per_page'] = filters.per_page;
      }
    }

    return (
      this.api.get<AuditLog[]>(this.endpoint, {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<AuditLog>>
    ).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data || [],
          meta: raw.meta || {
            current_page: raw.current_page || 1,
            last_page: raw.last_page || 1,
            per_page: raw.per_page || 25,
            total: raw.total !== undefined ? raw.total : (raw.data?.length || 0),
          },
        };
      })
    );
  }

  /**
   * GET /api/v1/audit-logs/{id}
   */
  public getAuditLogById(id: string | number): Observable<AuditLog> {
    return this.api.get<AuditLog>(`${this.endpoint}/${id}`).pipe(
      map((res) => res.data)
    );
  }
}
