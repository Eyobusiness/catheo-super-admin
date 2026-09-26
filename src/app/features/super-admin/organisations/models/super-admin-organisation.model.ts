export type OrganisationType = 'OPPE' | 'OPPJ' | 'OPPA';
export type OrganisationStatut = 'actif' | 'inactif' | 'suspendu';

export interface OrganisationParoisse {
  id?: number | string;
  nom_paroisse?: string;
  nom?: string;
  code_paroisse?: string;
  code?: string;
  diocese?: string;
  ville?: string;
  commune?: string;
  telephone?: string;
  email?: string;
}

export interface OrganisationProduit {
  id?: number | string;
  code: string;
  nom: string;
}

export type OrganisationMode = 'liee' | 'independant';

export interface SuperAdminOrganisation {
  id: number | string;
  uuid?: string;
  code: string;
  nom: string;
  type_organisation: OrganisationType;
  statut: OrganisationStatut;
  mode?: OrganisationMode;
  paroisse_configuration_id?: number | string;
  paroisse_id?: number | string;
  produit_code?: string;
  description?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  logo?: string;
  logo_url?: string;
  logo_path?: string;
  responsable_nom?: string;
  responsable_email?: string;
  responsable_telephone?: string;
  paroisse?: OrganisationParoisse;
  produit?: OrganisationProduit;
  responsable?: {
    nom?: string;
    email?: string;
    telephone?: string;
  };
  users_count?: number;
  membres_count?: number;
  activites_count?: number;
  created_at?: string;
  updated_at?: string;

  // Détails étendus F25 (9 modules)
  informations?: any;
  utilisateurs?: any[];
  statistiques?: {
    total_membres?: number;
    total_activites?: number;
    total_pelerinages?: number;
    total_utilisateurs?: number;
    total_operations?: number;
    solde_caisse?: number;
  };
  membres?: any[];
  activites?: any[];
  pelerinages?: any[];
  caisse?: {
    operations?: any[];
    solde_actuel?: number;
  };
  abonnement?: any;
}

export interface StoreResponsableDto {
  name: string;
  email: string;
  telephone?: string;
  password?: string;
  profil_id?: number | string;
}

export interface UpdateOrganisationInfoDto {
  nom?: string;
  description?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  paroisse_id?: string | null;
  independant?: boolean;
  responsable_nom?: string;
  responsable_telephone?: string;
  responsable_email?: string;
  logo?: File | string | null;
  supprimer_logo?: boolean;
}

export interface OrganisationsFilterParams {
  type_organisation?: OrganisationType | 'tous';
  statut?: OrganisationStatut | 'tous';
  mode?: OrganisationMode | 'tous';
  produit?: string;
  paroisse_id?: number | string;
  search?: string;
  page?: number;
  per_page?: number;
}

