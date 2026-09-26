import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../core/services/api-client.service';
import { PaginatedMeta } from '../../../core/models/api.models';

export interface OrganisationProfileData {
  id: string | number;
  code: string;
  nom: string;
  type_organisation: string;
  description?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  responsable?: string | null;
  mode: 'liee' | 'independant';
  paroisse_id?: number | null;
  logo_url?: string | null;
  statut: string;
  paroisse?: {
    id: number;
    nom_paroisse: string;
    code_paroisse: string;
    ville?: string;
  } | null;
}

export interface ParoisseItem {
  id: number;
  nom_paroisse: string;
  code_paroisse: string;
  ville?: string | null;
}

export interface AuditLogItem {
  id: number | string;
  action: string;
  table_concernee?: string | null;
  description?: string | null;
  auteur?: string | null;
  ip_address?: string | null;
  created_at: string;
  details?: any;
}

export interface OrgUserItem {
  id: number | string;
  uuid?: string;
  name: string;
  email: string;
  telephone?: string | null;
  statut: 'actif' | 'inactif' | 'suspendu';
  user_type: string;
  dernier_login_at?: string | null;
  profil?: {
    id: number;
    name: string;
    code: string;
  } | null;
  created_at?: string;
}

export interface OrgProfilOption {
  id: number;
  name: string;
  code: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganisationAdminService {
  private readonly api = inject(ApiClient);

  // ==========================================
  // INFORMATIONS / PROFIL
  // ==========================================

  public getProfile(): Observable<OrganisationProfileData> {
    return this.api.get<any>('organisation/info').pipe(
      map((res) => res.data || res)
    );
  }

  public updateProfile(data: FormData | Record<string, any>): Observable<OrganisationProfileData> {
    return this.api.post<any>('organisation/info', data).pipe(
      map((res) => res.data || res)
    );
  }

  public getParoisses(): Observable<ParoisseItem[]> {
    return this.api.get<any>('organisation/paroisses').pipe(
      map((res) => res.data || [])
    );
  }

  // ==========================================
  // AUDIT & HISTORIQUE
  // ==========================================

  public getAuditLogs(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Observable<{ data: AuditLogItem[]; meta: PaginatedMeta }> {
    return this.api.get<any>('organisation/audit-logs', { params }).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data || [],
          meta: raw.meta || {
            current_page: raw.current_page || 1,
            last_page: raw.last_page || 1,
            per_page: raw.per_page || 20,
            total: raw.total !== undefined ? raw.total : (raw.data?.length || 0),
          },
        };
      })
    );
  }

  // ==========================================
  // UTILISATEURS & RÔLES
  // ==========================================

  public getUsers(params?: {
    search?: string;
    statut?: string;
    page?: number;
    per_page?: number;
  }): Observable<{ data: OrgUserItem[]; meta: PaginatedMeta }> {
    return this.api.get<any>('organisation/users', { params }).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data || [],
          meta: raw.meta || {
            current_page: raw.current_page || 1,
            last_page: raw.last_page || 1,
            per_page: raw.per_page || 15,
            total: raw.total !== undefined ? raw.total : (raw.data?.length || 0),
          },
        };
      })
    );
  }

  public createUser(payload: Record<string, any>): Observable<OrgUserItem> {
    return this.api.post<any>('organisation/users', payload).pipe(
      map((res) => res.data || res)
    );
  }

  public updateUser(userId: string | number, payload: Record<string, any>): Observable<OrgUserItem> {
    return this.api.put<any>(`organisation/users/${userId}`, payload).pipe(
      map((res) => res.data || res)
    );
  }

  public toggleUserStatus(userId: string | number): Observable<any> {
    return this.api.patch<any>(`organisation/users/${userId}/toggle-status`, {}).pipe(
      map((res) => res.data || res)
    );
  }

  public deleteUser(userId: string | number): Observable<any> {
    return this.api.delete<any>(`organisation/users/${userId}`).pipe(
      map((res) => res.data || res)
    );
  }

  public getProfils(): Observable<OrgProfilOption[]> {
    return this.api.get<any>('organisation/users/profils').pipe(
      map((res) => res.data || [])
    );
  }
}
