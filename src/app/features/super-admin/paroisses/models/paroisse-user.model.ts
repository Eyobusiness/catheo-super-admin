export interface SystemProfil {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  is_system?: boolean | number;
  statut?: string;
}

export interface ParoisseUser {
  id: string; // UUID or string
  uuid?: string;
  id_interne?: number;
  paroisse_configuration_id: number;
  organisation_id: number | null;
  profil_id: number;
  profil?: SystemProfil;
  user_type: string; // default 'admin'
  username: string;
  name: string;
  email: string;
  telephone?: string | null;
  email_verified_at?: string | null;
  statut: 'actif' | 'inactif' | 'suspendu' | string;
  dernier_login_at?: string | null;
  remember_token?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
  deleted_at?: string | null;
}

export interface CreateParoisseUserDto {
  name: string;
  username: string;
  email: string;
  telephone?: string | null;
  profil_id: number;
  user_type?: string;
  password?: string;
  statut?: string;
}

export interface UpdateParoisseUserDto {
  name?: string;
  username?: string;
  email?: string;
  telephone?: string | null;
  profil_id?: number;
  user_type?: string;
  password?: string;
  statut?: string;
}
