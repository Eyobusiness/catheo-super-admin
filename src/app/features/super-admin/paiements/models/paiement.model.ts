import { PaginatedMeta } from '../../../../core/models/api.models';
import { EcheanceAbonnement } from './echeance.model';

export type PaiementStatut = 'en_attente' | 'valide' | 'annule' | 'rembourse';
export type ModePaiement = 'especes' | 'virement' | 'mobile_money' | 'cheque' | 'autre';

export interface CaissierRef {
  id: number | string;
  nom: string;
  prenom?: string;
  email: string;
}

export interface PaiementAbonnement {
  id: string | number;
  id_interne?: number;
  uuid?: string;
  reference: string; // PAY-YY-XXXX
  echeance_abonnement_id: number | string;
  montant: number;
  devise: string;
  mode_paiement: ModePaiement;
  date_paiement: string;
  statut: PaiementStatut;
  reference_transaction?: string | null;
  observation?: string | null;
  created_at: string;
  updated_at: string;
  echeance?: EcheanceAbonnement;
  caissier?: CaissierRef;
}

export interface PaiementPaginatedResponse {
  data: PaiementAbonnement[];
  meta: PaginatedMeta;
  links?: Record<string, any>;
}

export interface CreatePaiementData {
  echeance_abonnement_id: string | number;
  montant: number;
  devise?: string;
  mode_paiement: ModePaiement;
  date_paiement: string;
  reference_transaction?: string | null;
  observation?: string | null;
}

export interface PaiementActionData {
  observation?: string | null;
}

export interface PaiementFilterParams {
  statut?: PaiementStatut | 'tous';
  mode_paiement?: ModePaiement | 'tous';
  echeance_id?: string | number;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}
