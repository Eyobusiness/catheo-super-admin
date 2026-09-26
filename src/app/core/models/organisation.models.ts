export interface OrganisationParoisseRef {
  id: string | number;
  nom_paroisse: string;
  code_paroisse: string;
  diocese?: string;
  ville?: string;
}

export interface OrganisationContext {
  id: string;
  id_interne: number;
  type_organisation: 'OPPE' | 'OPPJ' | 'OPPA';
  code: string;
  nom: string;
  description?: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  produit_code: string;
  produit_nom: string;
  mode?: 'liee' | 'independant';
  paroisse_id?: number | string | null;
  logo?: string;
  paroisse?: OrganisationParoisseRef | null;
  responsable: {
    nom?: string;
    telephone?: string;
    email?: string;
  };
  contact: {
    telephone?: string;
    email?: string;
    adresse?: string;
  };
  stats: {
    total_membres: number;
    membres_actifs: number;
    total_activites: number;
    total_users: number;
  };
  date_activation?: string;
  created_at?: string;
}

export interface Membre {
  id: number;
  uuid: string;
  matricule?: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  profession?: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  date_adhesion?: string;
  photo_url?: string;
  notes?: string;
  created_at?: string;
}

export interface Activite {
  id: number;
  uuid: string;
  titre: string;
  type_activite?: string;
  description?: string;
  date_debut: string;
  date_fin?: string;
  lieu?: string;
  responsable_nom?: string;
  budget_prevu?: number;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  created_at?: string;
}

export interface OrganisationUser {
  id: string;
  uuid: string;
  nom: string;
  prenoms: string;
  email: string;
  telephone?: string;
  username?: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  profil_code?: string;
  profil_nom?: string;
  created_at?: string;
}

export interface CatheoPopulationItem {
  id: number;
  uuid: string;
  catechumene: {
    id: number;
    uuid: string;
    matricule: string;
    nom: string;
    prenoms: string;
    sexe: 'M' | 'F';
    date_naissance?: string;
    telephone_parent?: string;
  };
  section: {
    id: number;
    code: string;
    libelle: string;
  };
  niveau?: {
    id: number;
    libelle: string;
  };
  classe?: {
    id: number;
    nom: string;
  };
  annee_pastorale: string;
}

export interface CampagnePelerinage {
  id: number;
  uuid: string;
  titre: string;
  description?: string;
  destination: string;
  date_depart: string;
  date_retour: string;
  capacite_max: number;
  total_inscrits?: number;
  total_valides?: number;
  total_montant_prevu?: number;
  total_montant_encaisse?: number;
  statut: 'brouillon' | 'ouverte' | 'cloturee' | 'annulee';
  tarifs?: TarifPelerinage[];
  created_at?: string;
}

export interface TarifPelerinage {
  id: number;
  uuid: string;
  campagne_pelerinage_id: number;
  libelle: string;
  montant: number;
  description?: string;
  statut: 'actif' | 'inactif';
}

export interface InscriptionPelerinage {
  id: number;
  uuid: string;
  campagne_pelerinage_id: number;
  type_participant: 'membre' | 'catheo' | 'externe';
  participant_nom: string;
  participant_prenoms: string;
  telephone?: string;
  email?: string;
  sexe?: 'M' | 'F';
  tarif?: TarifPelerinage;
  tarif_montant: number;
  montant_paye: number;
  reste_a_payer: number;
  statut_paiement: 'en_attente' | 'partiel' | 'solde';
  statut_inscription: 'confirmee' | 'en_attente' | 'annulee';
  a_participe: boolean;
  date_pointage?: string;
  created_at?: string;
}

export interface PaiementPelerinage {
  id: number;
  uuid: string;
  campagne_pelerinage_id: number;
  inscription_pelerinage_id: number;
  reference_recu: string;
  montant: number;
  date_paiement: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  statut: 'valide' | 'annule';
  recu_url?: string;
  caissier_nom?: string;
  created_at?: string;
}

export interface CaisseOrganisation {
  solde_actuel: number;
  total_encaissements: number;
  total_decaissements: number;
  operations: Array<{
    id: number;
    uuid: string;
    type_operation: 'encaissement' | 'decaissement';
    motif: string;
    montant: number;
    date_operation: string;
    mode_paiement: string;
    reference_piece?: string;
    operateur_nom?: string;
  }>;
}

export interface DashboardOrganisation {
  contexte: OrganisationContext;
  indicateurs: {
    total_membres: number;
    membres_actifs: number;
    total_activites_annee: number;
    activites_a_venir: number;
    campagnes_pelerinage_actives: number;
    total_pelerins_inscrits: number;
    solde_caisse: number;
    catheo_connecte: boolean;
    catheo_population_count: number;
  };
  prochaines_activites: Activite[];
  campagnes_en_cours: CampagnePelerinage[];
}

export interface StatistiquesOrganisation {
  membres_par_sexe: { M: number; F: number };
  membres_par_tranche_age?: Record<string, number>;
  activites_par_statut: Record<string, number>;
  pelerinages_taux_remplissage: Array<{
    campagne_id: number;
    titre: string;
    capacite: number;
    inscrits: number;
    taux: number;
  }>;
  finances_flux_mensuels: Array<{
    mois: string;
    encaissements: number;
    decaissements: number;
  }>;
}
