/**
 * Modèles TypeScript stricts pour le module Membres de l'Organisation.
 * Correspond exactement à MembreResource et aux modèles/requêtes du backend Laravel (catheo).
 */

export type MembreStatut = 'actif' | 'inactif' | 'suspendu';
export type MembreSexe = 'M' | 'F';

export interface Membre {
  id: string; // UUID public
  id_interne: number; // ID entier pour audit/relations internes
  organisation_id?: string | number;
  nom: string;
  prenoms: string;
  nom_complet: string;
  sexe: MembreSexe;
  date_naissance?: string | null;
  telephone?: string | null;
  email?: string | null;
  quartier?: string | null;
  adresse?: string | null;
  fonction?: string | null;
  mandat?: string | null;
  date_entree?: string | null;
  statut: MembreStatut;
  photo_path?: string | null;
  observation?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MembreFilterParams {
  search?: string;
  statut?: MembreStatut | 'tous';
  sexe?: MembreSexe | 'tous';
  fonction?: string;
  page?: number;
  per_page?: number;
}

export interface CreateMembreDto {
  nom: string;
  prenoms: string;
  sexe: MembreSexe;
  date_naissance?: string | null;
  telephone?: string | null;
  email?: string | null;
  quartier?: string | null;
  adresse?: string | null;
  fonction?: string | null;
  mandat?: string | null;
  date_entree?: string | null;
  statut?: MembreStatut;
  photo_path?: string | null;
  observation?: string | null;
}

export interface UpdateMembreDto extends Partial<CreateMembreDto> {}
