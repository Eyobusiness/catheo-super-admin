import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse } from '../../../../core/models/api.models';
import { TrashDetail, TrashFilterParams, TrashItem } from '../models/trash.model';

export interface TrashListResponse {
  data: TrashItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TrashService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'super-admin/trash';

  /**
   * GET /api/v1/super-admin/trash
   */
  public getTrashItems(params?: TrashFilterParams): Observable<TrashListResponse> {
    const queryParams: Record<string, any> = {};
    if (params) {
      if (params.module) queryParams['module'] = params.module;
      if (params.search) queryParams['search'] = params.search;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return (
      this.api.get<TrashItem[]>(this.endpoint, {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<TrashItem>>
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
   * GET /api/v1/super-admin/trash/{uuid}
   * Renvoie l'aperçu complet avec dépendances avant restauration.
   */
  public getTrashDetail(uuid: string): Observable<TrashDetail> {
    return this.api.get<TrashDetail>(`${this.endpoint}/${uuid}`).pipe(
      map((res) => res.data)
    );
  }

  /**
   * POST /api/v1/super-admin/trash/{uuid}/restore
   */
  public restoreItem(uuid: string): Observable<any> {
    return this.api.post(`${this.endpoint}/${uuid}/restore`, {}).pipe(
      map((res) => res.data)
    );
  }

  /**
   * DELETE /api/v1/super-admin/trash/{uuid}/force
   */
  public forceDeleteItem(uuid: string): Observable<any> {
    return this.api.delete(`${this.endpoint}/${uuid}/force`).pipe(
      map((res) => res.data)
    );
  }
}
