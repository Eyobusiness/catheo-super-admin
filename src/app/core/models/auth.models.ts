export interface Profil {
  id: number;
  code: string;
  nom: string;
  description?: string;
  permissions?: string[];
  is_system?: boolean;
  statut?: string;
}

export interface ParoisseInfo {
  id: number | string;
  uuid?: string;
  nom_paroisse?: string;
  code_paroisse?: string;
  diocese?: string;
  ville?: string;
}

export interface User {
  id: string;
  uuid: string;
  paroisse_configuration_id?: number | null;
  paroisse_id?: number | null;
  organisation_id?: number | null;
  name?: string;
  nom?: string;
  prenoms?: string;
  lastName?: string;
  firstName?: string;
  email: string;
  username?: string;
  telephone?: string;
  phone?: string;
  user_type: 'super_admin' | 'organisation_user' | 'paroisse_admin' | 'admin' | string;
  statut: 'actif' | 'inactif' | 'suspendu';
  status?: string;
  dernier_login_at?: string | null;
  profil?: Profil | null;
  profile?: Profil | null;
  paroisse?: ParoisseInfo | null;
  created_at?: string;
}

export interface LoginDto {
  login: string;
  password: string;
  device_name?: string;
  organisation_type?: 'OPPE' | 'OPPJ' | 'OPPA';
}

export interface LoginResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    token: string;
    token_type: string;
    user_type: string;
    user: User;
    menus?: any[];
    annee_courante?: any;
  };
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyCodeDto {
  email: string;
  code: string;
}

export interface ResetPasswordDto {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
  device_name?: string;
}

export interface ChangePasswordDto {
  current_password?: string;
  password: string;
  password_confirmation: string;
}
