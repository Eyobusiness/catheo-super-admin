import { PaginatedMeta } from '../../../../core/models/api.models';
import { EcheanceAbonnement } from '../../paiements/models/echeance.model';

export type FactureStatut = 'en_attente' | 'payee' | 'annulee';

export interface Facture {
  id: string | number;
  id_interne?: number;
  uuid?: string;
  echeance_abonnement_id: number | string;
  reference: string; // FAC-YY-XXXX
  date_facture: string;
  date_echeance: string;
  montant_ht: number;
  taux_tva: number;
  montant_tva: number;
  montant_ttc: number;
  statut: FactureStatut;
  fichier_pdf_path?: string | null;
  description?: string | null;
  observation?: string | null;
  echeance?: EcheanceAbonnement;
  created_at: string;
  updated_at: string;
}

export interface FacturePaginatedResponse {
  data: Facture[];
  meta: PaginatedMeta;
  links?: Record<string, any>;
}

export interface FactureFilterParams {
  statut?: FactureStatut | 'tous';
  date_debut?: string;
  date_fin?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
