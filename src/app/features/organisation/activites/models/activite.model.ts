import { Membre } from '../../membres/models/membre.model';

export type ActiviteStatut =
  | 'brouillon'
  | 'planifiee'
  | 'en_cours'
  | 'terminee'
  | 'annulee';

export interface Activite {
  id: string; // UUID public
  id_interne: number; // ID entier en base
  organisation_id?: string | number;
  code?: string | null;
  titre: string;
  description?: string | null;
  type_activite?: string | null;
  date_debut: string; // ISO 8601 string
  date_fin?: string | null; // ISO 8601 string
  lieu?: string | null;
  responsable_id?: string | number | null;
  responsable?: Membre | null;
  statut: ActiviteStatut;
  taux_execution: number; // 0.00 à 100.00
  observation?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ActiviteFilterParams {
  search?: string;
  statut?: ActiviteStatut | 'tous';
  type_activite?: string;
  date_debut?: string;
  date_fin?: string;
  page?: number;
  per_page?: number;
}

export interface CreateActiviteDto {
  code?: string | null;
  titre: string;
  description?: string | null;
  type_activite?: string | null;
  date_debut: string;
  date_fin?: string | null;
  lieu?: string | null;
  responsable_id?: string | number | null;
  statut?: ActiviteStatut;
  taux_execution?: number;
  observation?: string | null;
}

export interface UpdateActiviteDto {
  code?: string | null;
  titre?: string;
  description?: string | null;
  type_activite?: string | null;
  date_debut?: string;
  date_fin?: string | null;
  lieu?: string | null;
  responsable_id?: string | number | null;
  statut?: ActiviteStatut;
  taux_execution?: number;
  observation?: string | null;
}
