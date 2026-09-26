// ==========================================
// RAPPORT ANNUEL CONSOLIDE
// GET /api/v1/organisation/rapports/annuel
// ==========================================

export interface RapportOrganisationInfo {
  id: number;
  nom: string;
  code: string;
  type_organisation: string;
}

export interface RapportMembresInfo {
  total: number;
  actifs: number;
  inactifs: number;
  nouvelles_adhesions: number;
}

export interface RapportActivitesInfo {
  total: number;
  repartition_statut: Record<string, number>;
  taux_moyen_execution: number;
}

export interface RapportPelerinagesInfo {
  campagnes: number;
  total_participants: number;
  presents: number;
  absents: number;
  taux_presence: number;
}

export interface RapportFinancesInfo {
  total_entrees: number;
  total_sorties: number;
  solde_net: number;
}

export interface RapportCatheoInfo {
  catheo_connecte: boolean;
  annee_catechese?: string;
  total_population?: number;
  sections?: string[];
  message?: string;
}

export interface RapportAnnuel {
  annee_exercice: number;
  organisation: RapportOrganisationInfo;
  membres: RapportMembresInfo;
  activites: RapportActivitesInfo;
  pelerinages: RapportPelerinagesInfo;
  finances: RapportFinancesInfo;
  catheo: RapportCatheoInfo;
}

export interface RapportFiltres {
  annee: number;
}
