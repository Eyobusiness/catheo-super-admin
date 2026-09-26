export type CampagneStatut =
  | 'brouillon'
  | 'ouverte'
  | 'cloturee'
  | 'annulee'
  | 'terminee';

export type InscriptionStatut =
  | 'en_attente'
  | 'partiellement_payee'
  | 'payee'
  | 'annulee';

export type ParticipationStatut = 'prevue' | 'presente' | 'absente';

export type ParticipantType = 'CATECHUMENE' | 'EXTERNE';

export type TailleKit =
  | 'M'
  | 'L'
  | 'XL'
  | 'XXL'
  | 'XXXL';

export type ModePaiement =
  | 'espece'
  | 'virement'
  | 'cheque'
  | 'mobile_money'
  | 'carte_bancaire';

export interface ActiviteRef {
  id: number;
  code: string;
  titre: string;
}

export interface TarifPelerinage {
  id: number;
  uuid: string;
  campagne_pelerinage_id: number;
  code?: string | null;
  libelle: string;
  description?: string | null;
  montant: number;
  devise: string;
  statut: 'actif' | 'inactif';
  created_at?: string;
  updated_at?: string;
}

export interface CampagneStatistiques {
  campagne_id?: number;
  total_inscrits: number;
  capacite: number | null;
  places_occupees: number;
  places_restantes: number | null;
  est_complete: boolean;
  montant_attendu: number;
  montant_collecte: number;
  solde_restant: number;
  repartition_participation: {
    prevue: number;
    presente: number;
    absente: number;
  };
  repartition_statuts: {
    en_attente: number;
    partiellement_payee: number;
    payee: number;
    annulee: number;
  };
  [key: string]: any;
}

export interface CampagnePelerinage {
  id: number;
  uuid: string;
  organisation_id: number;
  activite_id?: number | null;
  code: string;
  nom: string;
  description?: string | null;
  lieu_depart?: string | null;
  destination: string;
  date_depart: string;
  heure_depart?: string | null;
  date_fin: string;
  heure_fin?: string | null;
  date_debut_inscription?: string | null;
  date_fin_inscription?: string | null;
  capacite?: number | null;
  places_occupees?: number;
  places_restantes?: number | null;
  est_complete?: boolean;
  statut: CampagneStatut;
  observation?: string | null;
  activite?: ActiviteRef | null;
  tarifs?: TarifPelerinage[];
  total_inscrits?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InscriptionPelerinage {
  id: number;
  uuid: string;
  campagne_pelerinage_id: number;
  tarif_pelerinage_id: number;
  catechumene_id?: number | null;
  type_participant: ParticipantType;
  reference: string;
  nom: string;
  prenoms?: string | null;
  nom_complet: string;
  age?: number | null;
  sexe?: 'M' | 'F' | null;
  taille?: TailleKit | string | null;
  telephone?: string | null;
  adresse?: string | null;
  contact_urgence_nom?: string | null;
  contact_urgence_telephone?: string | null;
  montant: number;
  montant_paye: number;
  reste_a_payer: number;
  statut_inscription: InscriptionStatut;
  statut_participation: ParticipationStatut;
  date_inscription?: string | null;
  badge_imprime?: boolean;
  kit_remis?: boolean;
  date_remise_kit?: string | null;
  observation?: string | null;
  tarif?: TarifPelerinage;
  campagne?: CampagnePelerinage;
  paiements?: PaiementPelerinage[];
  created_at?: string;
  updated_at?: string;
}

export interface PaiementPelerinage {
  id: number;
  uuid: string;
  inscription_pelerinage_id: number;
  reference: string;
  montant: number;
  devise: string;
  mode_paiement: ModePaiement | string;
  date_paiement?: string | null;
  statut: 'valide' | 'annule' | 'rembourse' | string;
  reference_transaction?: string | null;
  observation?: string | null;
  caissier?: {
    id: number;
    name: string;
    email: string;
  } | null;
  inscription?: InscriptionPelerinage;
  created_at?: string;
  updated_at?: string;
}

export interface CampagneFilters {
  statut?: CampagneStatut | 'tous';
  date_depart_min?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface InscriptionFilters {
  statut_inscription?: InscriptionStatut | 'tous';
  statut_participation?: ParticipationStatut | 'tous';
  type_participant?: ParticipantType | 'tous';
  tarif_id?: number | string;
  taille?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PaiementFilters {
  statut?: string | 'tous';
  mode_paiement?: string | 'tous';
  search?: string;
  page?: number;
  per_page?: number;
}

export interface StoreCampagnePayload {
  nom: string;
  description?: string | null;
  activite_id?: number | null;
  lieu_depart: string;
  destination: string;
  date_depart: string;
  heure_depart?: string | null;
  date_fin: string;
  heure_fin?: string | null;
  date_debut_inscription?: string | null;
  date_fin_inscription?: string | null;
  capacite?: number | null;
  observation?: string | null;
}

export interface UpdateCampagnePayload {
  nom?: string;
  description?: string | null;
  activite_id?: number | null;
  lieu_depart?: string;
  destination?: string;
  date_depart?: string;
  heure_depart?: string | null;
  date_fin?: string;
  heure_fin?: string | null;
  date_debut_inscription?: string | null;
  date_fin_inscription?: string | null;
  capacite?: number | null;
  statut?: CampagneStatut;
  observation?: string | null;
}

export interface StoreTarifPayload {
  code?: string | null;
  libelle: string;
  description?: string | null;
  montant: number;
  devise?: string;
  statut?: 'actif' | 'inactif';
}

export interface StoreInscriptionPayload {
  tarif_pelerinage_id: number;
  type_participant?: ParticipantType;
  catechumene_id?: number | null;
  nom?: string | null;
  prenoms?: string | null;
  age?: number | null;
  sexe?: 'M' | 'F' | null;
  taille?: TailleKit | string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  contact_urgence_nom?: string | null;
  contact_urgence_telephone?: string | null;
  observation?: string | null;
}

export interface StorePaiementPayload {
  montant: number;
  devise?: string;
  mode_paiement: ModePaiement | string;
  date_paiement?: string | null;
  reference_transaction?: string | null;
  observation?: string | null;
}
