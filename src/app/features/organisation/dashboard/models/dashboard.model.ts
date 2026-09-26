/**
 * Modèles TypeScript stricts pour le Dashboard Organisation (OPPE / OPPJ / OPPA).
 * Correspond exactement à la structure renvoyée par OrganisationDashboardService@getDashboard dans Laravel.
 */

export interface OrganisationDashboardOrgInfo {
  id: number;
  uuid: string;
  code: string;
  nom: string;
  type_organisation: 'OPPE' | 'OPPJ' | 'OPPA';
  statut: string;
}

export interface MembresMetricsData {
  total: number;
  actifs: number;
  inactifs: number;
}

export interface ActivitesMetricsData {
  total: number;
  brouillon: number;
  planifiees: number;
  en_cours: number;
  terminees: number;
  annulees: number;
  taux_moyen_execution: number;
}

export interface PelerinagesMetricsData {
  campagnes_total: number;
  campagnes_ouvertes: number;
  campagnes_cloturees: number;
  campagnes_annulees: number;
  capacite_totale: number;
  places_occupees: number;
  places_restantes: number | null;
  total_inscrits: number;
  inscrits_payes: number;
  inscrits_partiellement_payes: number;
  inscrits_en_attente: number;
  inscrits_annules: number;
  inscrits_presents: number;
  inscrits_absents: number;
  montant_attendu: number;
  montant_encaisse: number;
  reste_a_encaisser: number;
}

export interface FinancesMetricsData {
  total_entrees: number;
  total_sorties: number;
  solde_caisse: number;
}

export interface CatheoRepartitionItem {
  niveau_id?: number;
  niveau?: string;
  classe_id?: number;
  classe?: string;
  total: number;
}

export interface CatheoMetricsData {
  catheo_connecte: boolean;
  message?: string;
  annee_catechese?: string;
  total_population?: number;
  repartition_niveaux?: CatheoRepartitionItem[];
  repartition_classes?: CatheoRepartitionItem[];
  // Ventilation spécifique OPPE (Primaire + Collège)
  total_primaire?: number;
  total_college?: number;
  // Ventilation spécifique OPPJ / OPPA
  total_jeunes?: number;
  total_adultes?: number;
}

export interface DashboardNotification {
  type: 'warning' | 'info' | 'success' | 'danger';
  titre: string;
  message: string;
}

export interface DashboardProchaineActivite {
  id: number;
  uuid?: string;
  titre: string;
  date_debut: string;
  lieu?: string | null;
  statut: string;
  budget_prevu?: number | null;
}

export interface DashboardProchaineCampagne {
  id: number;
  uuid?: string;
  nom: string;
  destination: string;
  date_depart: string;
  date_retour: string;
  statut: string;
  capacite_max: number;
  total_inscrits: number;
}

export interface DashboardDernierPaiement {
  id: number;
  uuid?: string;
  reference_recu: string;
  montant: number;
  mode_paiement: string;
  statut: string;
  date_paiement: string;
  inscription?: {
    id: number;
    uuid?: string;
    nom: string;
    prenoms: string;
    reference: string;
  };
}

export interface DashboardWidgetsData {
  prochaines_activites: DashboardProchaineActivite[];
  prochaines_campagnes: DashboardProchaineCampagne[];
  derniers_paiements: DashboardDernierPaiement[];
  notifications: DashboardNotification[];
}

export interface OrganisationDashboardData {
  organisation: OrganisationDashboardOrgInfo;
  membres: MembresMetricsData;
  activites: ActivitesMetricsData;
  pelerinages: PelerinagesMetricsData;
  finances: FinancesMetricsData;
  catheo: CatheoMetricsData;
  widgets?: DashboardWidgetsData;
}

