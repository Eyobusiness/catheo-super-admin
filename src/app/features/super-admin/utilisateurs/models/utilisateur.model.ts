export interface ProfilRef {
  id: string;
  code: string;
  nom: string;
}

export interface ParoisseRef {
  id: string;
  nom_paroisse: string;
  code_paroisse: string;
}

export interface OrganisationRef {
  id: string;
  nom: string;
  type_organisation: string;
}

export interface Utilisateur {
  id: string;
  uuid?: string;
  id_interne?: number;
  name: string;
  nom?: string;
  email: string;
  telephone?: string | null;
  user_type: 'super_admin' | 'paroisse_admin' | 'organisation_user' | 'user' | string;
  statut: 'actif' | 'bloque' | string;
  profil?: ProfilRef | null;
  paroisse?: ParoisseRef | null;
  organisation?: OrganisationRef | null;
  dernier_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
  permissions?: string[];
  historique?: {
    action: string;
    description: string;
    date: string;
  }[];
}

export interface UtilisateurFilters {
  user_type?: string;
  paroisse_id?: string;
  organisation_id?: string;
  statut?: string;
  profil?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
