export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'force_delete'
  | 'login'
  | 'logout'
  | 'export';

export interface AuditUser {
  id: number | string;
  uuid?: string;
  name: string;
  email: string;
}

export interface AuditLog {
  id: string | number; // UUID retourné par AuditLogResource
  action: AuditActionType | string;
  entite_type: string;
  entite_id?: number | string | null;
  module?: string;
  anciennes_valeurs?: Record<string, any> | null;
  nouvelles_valeurs?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  user?: AuditUser | null;
  created_at: string;
}

export interface AuditFilters {
  action?: AuditActionType | 'tous';
  entite_type?: string;
  module?: string;
  user_id?: string;
  search?: string;
  periode?: string;
  page?: number;
  per_page?: number;
}

