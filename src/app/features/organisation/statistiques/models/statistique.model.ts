export interface StatistiqueSerie {
  periode: string;
  total: number;
  label?: string;
}

// ==========================================
// 1. STATISTIQUES MEMBRES
// GET /api/v1/organisation/statistiques/membres
// ==========================================

export interface StatistiquesMembres {
  total: number;
  actifs: number;
  inactifs: number;
  repartition_sexe: {
    M: number;
    F: number;
  };
  repartition_fonction: Record<string, number>;
  evolution_adhesions: Record<string, number>;
}

export interface MembresStatFilters {
  statut?: string;
  sexe?: string;
  fonction?: string;
  date_debut?: string;
  date_fin?: string;
}

// ==========================================
// 2. STATISTIQUES ACTIVITES
// GET /api/v1/organisation/statistiques/activites
// ==========================================

export interface StatistiquesActivites {
  total: number;
  taux_moyen_execution: number;
  repartition_statut: Record<string, number>;
  repartition_type: Record<string, number>;
  activites_par_periode: Record<string, number>;
}

export interface ActivitesStatFilters {
  statut?: string;
  type_activite?: string;
  date_debut?: string;
  date_fin?: string;
}

// ==========================================
// 3. STATISTIQUES PELERINAGES
// GET /api/v1/organisation/statistiques/pelerinages
// ==========================================

export interface CampagnesStatMetrics {
  total: number;
  repartition_statut: Record<string, number>;
  capacite_totale: number;
  places_occupees: number;
  places_restantes: number | null;
  taux_occupation: number | null;
}

export interface InscriptionsStatMetrics {
  total: number;
  catheo: number;
  externes: number;
  payes: number;
  partiellement_payes: number;
  en_attente: number;
  annules: number;
  presents: number;
  absents: number;
  prevus: number;
  taux_presence: number;
}

export interface FinancesPelerinagesStatMetrics {
  montant_attendu: number;
  montant_encaisse: number;
  solde_restant: number;
  taux_recouvrement: number;
}

export interface StatistiquesPelerinages {
  campagnes: CampagnesStatMetrics;
  inscriptions: InscriptionsStatMetrics;
  finances: FinancesPelerinagesStatMetrics;
}

export interface PelerinagesStatFilters {
  campagne_id?: number;
  date_debut?: string;
  date_fin?: string;
  statut_inscription?: string;
  type_participant?: string;
}

// ==========================================
// 4. STATISTIQUES FINANCES
// GET /api/v1/organisation/statistiques/finances
// ==========================================

export interface EvolutionFinanciereMensuelle {
  periode: string;
  entrees: number;
  sorties: number;
  solde: number;
}

export interface ModeReglementStat {
  mode: string;
  total: number;
  count: number;
}

export interface StatistiquesFinances {
  total_entrees: number;
  total_sorties: number;
  solde: number;
  recettes_pelerinages: number;
  autres_recettes: number;
  evolution_mensuelle: EvolutionFinanciereMensuelle[];
  repartition_modes: ModeReglementStat[];
}

export interface FinancesStatFilters {
  date_debut?: string;
  date_fin?: string;
  campagne_id?: number;
}

// ==========================================
// 5. SYNTHESE DASHBOARD (REUTILISABLE)
// GET /api/v1/organisation/dashboard
// ==========================================

export interface OrganisationDashboardMetrics {
  organisation: {
    id: number;
    uuid: string;
    code: string;
    nom: string;
    type_organisation: string;
    statut: string;
  };
  membres: {
    total: number;
    actifs: number;
    inactifs: number;
  };
  activites: {
    total: number;
    brouillon: number;
    planifiees: number;
    en_cours: number;
    terminees: number;
    annulees: number;
    taux_moyen_execution: number;
  };
  pelerinages: {
    campagnes_total: number;
    campagnes_ouvertes: number;
    campagnes_cloturees: number;
    campagnes_annulees: number;
    capacite_totale: number;
    places_occupees: number;
    places_restantes: number;
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
  };
  finances: {
    total_entrees: number;
    total_sorties: number;
    solde: number;
    recettes_pelerinages: number;
    autres_recettes: number;
  };
  catheo: {
    catheo_connecte: boolean;
    annee_catechese?: string;
    total_population?: number;
    sections?: string[];
    repartition_classes?: Record<string, number>;
    repartition_niveaux?: Record<string, number>;
    message?: string;
  };
}
