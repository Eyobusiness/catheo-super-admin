import { PaginatedMeta } from '../../../../core/models/api.models';
import { Abonnement } from '../../abonnements/models/abonnement.model';
import { PaiementAbonnement } from './paiement.model';
import { Facture } from '../../factures/models/facture.model';

export type EcheanceStatut = 'en_attente' | 'payee' | 'en_retard' | 'annulee';

export interface EcheanceAbonnement {
  id: string | number;
  id_interne?: number;
  uuid?: string;
  abonnement_id: number | string;
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
  abonnement?: Abonnement;
  facture?: Facture | null;
  paiements?: PaiementAbonnement[];
  created_at?: string;
  updated_at?: string;
}

export interface EcheancePaginatedResponse {
  data: EcheanceAbonnement[];
  meta: PaginatedMeta;
  links?: Record<string, any>;
}

export interface EcheanceFilterParams {
  abonnement_id?: string | number;
  statut?: EcheanceStatut | 'tous';
  en_retard?: boolean;
  page?: number;
  per_page?: number;
}

export interface GenererFactureData {
  taux_tva?: number;
  date_facture?: string;
  description?: string;
  observation?: string;
}
