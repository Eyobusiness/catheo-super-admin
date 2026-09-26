export type TypeOperationCaisse = 'entree' | 'sortie';
export type StatutOperationCaisse = 'valide' | 'annule';

export type ModeReglementCaisse =
  | 'especes'
  | 'mobile_money'
  | 'virement'
  | 'cheque'
  | 'carte_bancaire'
  | string;

export interface OperationCaisseOperateur {
  id: number;
  name: string;
}

export interface OperationCaisse {
  id: number;
  uuid: string;
  organisation_id: number;
  campagne_pelerinage_id?: number | null;
  inscription_pelerinage_id?: number | null;
  paiement_pelerinage_id?: number | null;
  reference: string;
  type_operation: TypeOperationCaisse;
  montant: number;
  devise: string;
  libelle: string;
  mode_reglement: ModeReglementCaisse;
  date_operation: string;
  statut: StatutOperationCaisse;
  operateur?: OperationCaisseOperateur | null;
  created_at?: string;
}

export interface SyntheseCaisse {
  periode_debut: string | null;
  periode_fin: string | null;
  solde_initial: number;
  total_entrees: number;
  total_sorties: number;
  solde_periode: number;
  solde_final: number;
  nombre_operations: number;
}

export interface CaissePaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CaisseResponse {
  status: string;
  message: string;
  synthese: SyntheseCaisse;
  data: OperationCaisse[];
  meta: CaissePaginationMeta;
}

export interface CaisseFilters {
  date_debut?: string;
  date_fin?: string;
  type_operation?: 'tous' | TypeOperationCaisse;
  campagne_id?: number | string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface EvolutionMensuelleItem {
  periode: string;
  total: number;
}

export interface RepartitionModeItem {
  mode: string;
  total: number;
  pourcentage: number;
}

export interface StatistiquesFinances {
  total_entrees: number;
  total_sorties: number;
  solde: number;
  recettes_pelerinages: number;
  autres_recettes: number;
  evolution_mensuelle: EvolutionMensuelleItem[];
  repartition_modes: RepartitionModeItem[];
}

export interface StatistiquesFinancesResponse {
  status: string;
  message: string;
  data: StatistiquesFinances;
}

export interface InscriptionPaiementsMeta {
  montant_total: number;
  montant_paye: number;
  reste_a_payer: number;
  statut: string;
}

export interface InscriptionPaiementsResponse {
  status: string;
  message: string;
  data: any[];
  meta: InscriptionPaiementsMeta;
}

export interface StoreDepensePayload {
  montant: number;
  libelle: string;
  mode_reglement: ModeReglementCaisse;
  date_operation?: string | null;
  campagne_pelerinage_id?: number | null;
  beneficiaire?: string | null;
  observation?: string | null;
}

