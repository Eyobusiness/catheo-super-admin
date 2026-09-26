export interface Produit {
  id: number;
  uuid: string;
  code: 'CATHEO' | 'OPPE' | 'OPPJ' | 'OPPA' | string;
  nom: string;
  description?: string | null;
  icone?: string | null;
  statut: 'actif' | 'inactif';
  created_at?: string;
  organisations_count?: number;
}

export interface Formule {
  id: number;
  uuid: string;
  produit_id: number;
  nom: string;
  description?: string | null;
  periodicite: 'mensuel' | 'trimestriel' | 'annuel';
  prix: number;
  devise: string;
  statut: 'actif' | 'inactif';
  produit?: Produit;
  created_at?: string;
}

export interface ParoisseSupervision {
  id: number;
  uuid?: string;
  nom_paroisse: string;
  code_paroisse: string;
  diocese?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  statut?: string;
  organisations_count?: number;
  abonnements_count?: number;
  created_at?: string;
}

export interface OrganisationSupervision {
  id: number;
  uuid: string;
  paroisse_configuration_id: number;
  produit_id: number;
  code: string;
  nom: string;
  type_organisation: 'OPPE' | 'OPPJ' | 'OPPA';
  description?: string | null;
  statut: 'actif' | 'inactif' | 'suspendu';
  responsable_nom?: string | null;
  responsable_telephone?: string | null;
  responsable_email?: string | null;
  paroisse?: ParoisseSupervision;
  produit?: Produit;
  users_count?: number;
  membres_count?: number;
  created_at?: string;
}

export interface CreateResponsableDto {
  nom: string;
  prenoms?: string;
  email: string;
  telephone?: string;
  password?: string;
}

export interface Abonnement {
  id: number;
  uuid: string;
  paroisse_configuration_id: number;
  organisation_id?: number | null;
  produit_id: number;
  formule_id: number;
  date_debut: string;
  date_fin?: string | null;
  montant_total: number;
  statut: 'actif' | 'en_attente' | 'echu' | 'resilie' | 'suspendu';
  paroisse?: ParoisseSupervision;
  organisation?: OrganisationSupervision | null;
  produit?: Produit;
  formule?: Formule;
  echeances?: Echeance[];
  created_at?: string;
}

export interface Echeance {
  id: number;
  uuid: string;
  abonnement_id: number;
  numero_echeance: number;
  date_echeance: string;
  montant: number;
  montant_paye: number;
  statut: 'en_attente' | 'partiel' | 'paye' | 'echu' | 'annule';
  facture_id?: number | null;
  abonnement?: Abonnement;
  created_at?: string;
}

export interface PaiementAbonnement {
  id: number;
  uuid: string;
  abonnement_id: number;
  echeance_id?: number | null;
  reference_paiement: string;
  montant: number;
  date_paiement: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  statut: 'valide' | 'annule' | 'rembourse';
  commentaire?: string | null;
  operateur_nom?: string | null;
  abonnement?: Abonnement;
  echeance?: Echeance | null;
  created_at?: string;
}

export interface Facture {
  id: number;
  uuid: string;
  numero_facture: string;
  abonnement_id: number;
  echeance_id?: number | null;
  date_emission: string;
  date_echeance: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  statut: 'emise' | 'payee' | 'annulee';
  abonnement?: Abonnement;
  echeance?: Echeance | null;
  created_at?: string;
}

export interface SuperAdminDashboardKPI {
  total_paroisses: number;
  total_organisations: number;
  organisations_par_produit: Record<string, number>;
  total_abonnements_actifs: number;
  mrr: number;
  chiffre_affaires_total: number;
  echeances_en_attente_montant: number;
  echeances_echues_count: number;
  alertes: Array<{
    type: 'warning' | 'danger' | 'info';
    message: string;
    date?: string;
  }>;
}
