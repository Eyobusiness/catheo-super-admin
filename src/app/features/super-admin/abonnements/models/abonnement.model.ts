import { PaginatedMeta } from '../../../../core/models/api.models';

export type AbonnementStatut =
  | 'en_attente'
  | 'actif'
  | 'suspendu'
  | 'expire'
  | 'resilie';

export type EcheanceStatut =
  | 'en_attente'
  | 'payee'
  | 'en_retard'
  | 'annulee';

export interface FactureSummary {
  id: string | number;
  id_interne?: number;
  reference?: string;
  numero?: string;
  numero_facture?: string;
  date_emission?: string;
  date_echeance?: string;
  montant_ht?: number;
  montant_ttc?: number;
  montant_total?: number;
  statut: string;
  fichier_pdf_url?: string | null;
}

export interface PaiementSummary {
  id: string | number;
  id_interne?: number;
  reference: string;
  montant: number;
  devise: string;
  date_paiement: string;
  statut: string;
  mode_paiement?: string;
}

export interface EcheanceAbonnement {
  id: string | number;
  id_interne?: number;
  abonnement_id: string | number;
  reference: string; // ECH-YY-XXXX
  periode_debut: string;
  periode_fin: string;
  date_echeance: string;
  montant: number;
  montant_paye: number;
  solde_restant: number;
  devise: string;
  statut: EcheanceStatut;
  observation?: string | null;
  facture?: FactureSummary | null;
  paiements?: PaiementSummary[];
  created_at?: string;
  updated_at?: string;
}

export interface ParoisseRef {
  id: string | number;
  nom_paroisse?: string;
  code_paroisse?: string;
  diocese?: string;
  telephone?: string | null;
  email?: string | null;
}

export interface FormuleRef {
  id: string | number;
  uuid?: string;
  produit_id?: string | number;
  code?: string;
  nom?: string;
  description?: string | null;
  periodicite?: string;
  montant?: number;
  devise?: string;
  est_gratuite?: boolean;
  statut?: string;
  produit?: {
    id: string | number;
    code: string;
    nom: string;
  };
}

export interface Abonnement {
  id: string | number;
  uuid?: string;
  id_interne?: number;
  reference: string; // ABO-YY-XXXX
  paroisse_id: string | number;
  paroisse_nom?: string;
  paroisse_code?: string;
  organisation_id?: string | number | null;
  organisation_nom?: string;
  organisation?: any;
  produit_code?: string;
  produit_nom?: string;
  formule_id: string | number;
  formule_nom?: string;
  formule_code?: string;
  date_debut: string;
  date_fin: string | null;
  statut: AbonnementStatut;
  montant: number;
  montant_total?: number;
  devise: string;
  renouvellement_automatique: boolean;
  date_resiliation?: string | null;
  motif_resiliation?: string | null;
  observation?: string | null;
  paroisse?: ParoisseRef;
  formule?: FormuleRef;
  echeances?: EcheanceAbonnement[];
  created_at: string;
  updated_at: string;
}

export interface AbonnementPaginatedResponse {
  data: Abonnement[];
  meta: PaginatedMeta;
  links?: Record<string, any>;
}

export interface EcheancePaginatedResponse {
  data: EcheanceAbonnement[];
  meta: PaginatedMeta;
  links?: Record<string, any>;
}

export interface AbonnementFilterParams {
  paroisse_id?: string | number;
  organisation_id?: string | number;
  produit_id?: string | number;
  statut?: AbonnementStatut | 'tous';
  page?: number;
  per_page?: number;
}

export interface AbonnementFormData {
  paroisse_configuration_id: string | number;
  formule_id: string | number;
  date_debut?: string | null;
  date_fin?: string | null;
  renouvellement_automatique?: boolean;
  observation?: string | null;
}

export interface OrganisationAbonnementFormData {
  organisation_id: string | number;
  formule_id: string | number;
  date_debut?: string | null;
  date_fin?: string | null;
  renouvellement_automatique?: boolean;
  observation?: string | null;
}


export interface ChangerStatutData {
  statut: AbonnementStatut;
  observation?: string | null;
}

export interface ResilierAbonnementData {
  motif_resiliation: string;
  date_resiliation?: string | null;
  observation?: string | null;
}
