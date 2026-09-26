export type ParoisseStatut = 'actif' | 'suspendu' | 'inactif';

export interface ProduitSouscrit {
  produit_code?: string;
  produit_nom?: string;
  formule_nom?: string;
  date_fin?: string;
}

export interface ParoisseAbonnement {
  id: string;
  statut: string;
  date_debut?: string;
  date_fin?: string;
  formule?: {
    id: number;
    nom: string;
    code?: string;
    produit?: {
      id: number;
      nom: string;
      code: string;
    };
  };
  echeances?: any[];
}

export interface ParoisseOrganisationRef {
  id: string; // UUID
  uuid?: string;
  id_interne?: number;
  type_organisation: 'OPPE' | 'OPPJ' | 'OPPA' | string;
  produit_code?: string;
  produit_nom?: string;
  nom: string;
  code?: string;
  description?: string | null;
  logo_url?: string | null;
  statut: 'actif' | 'suspendu' | 'inactif' | string;
  responsable_nom?: string | null;
  responsable_telephone?: string | null;
  responsable_email?: string | null;
  created_at?: string;
}

export interface Paroisse {
  id: string; // UUID
  id_interne: number;
  nom_paroisse: string;
  code_paroisse: string;
  diocese: string;
  doyenne: string;
  ville: string;
  commune: string;
  telephone: string | null;
  email: string | null;
  statut: ParoisseStatut;
  total_abonnements: number;
  total_organisations?: number;
  produits_souscrits: (ProduitSouscrit | string)[];
  organisations?: ParoisseOrganisationRef[];
  abonnements?: ParoisseAbonnement[];
  created_at: string;
  updated_at?: string;
}

export interface ParoisseDetail extends Paroisse {
  prefixe_matricule?: string | null;
  prefixe_recu?: string | null;
  site_web?: string | null;
  adresse?: string | null;
  cure_nom?: string | null;
  coordination_nom?: string | null;
  logo_paroisse?: string | null;
  logo_paroisse_url?: string | null;
  logo_catechese?: string | null;
  logo_catechese_url?: string | null;
}

export interface ParoisseFilterParams {
  search?: string;
  statut?: ParoisseStatut | 'tous';
  ville?: string;
  diocese?: string;
  page?: number;
  per_page?: number;
}

export interface ParoisseListResponse {
  status: string;
  message?: string;
  data: Paroisse[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
