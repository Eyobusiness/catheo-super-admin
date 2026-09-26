export type SectionCode =
  | 'SEC-ENFANTS-PRI'
  | 'SEC-ENF-PRI'
  | 'SEC-ENFANTS-COL'
  | 'SEC-ENF-COL'
  | 'SEC-JEUNES'
  | 'SEC-JEUNE'
  | 'SEC-ADULTES'
  | 'SEC-ADULTE';

export type PopulationType = 'OPPE' | 'OPPJ' | 'OPPA';

export const SECTION_POPULATION_MAP: Record<string, PopulationType> = {
  'SEC-ENFANTS-PRI': 'OPPE',
  'SEC-ENF-PRI': 'OPPE',
  'SEC-ENFANTS-COL': 'OPPE',
  'SEC-ENF-COL': 'OPPE',
  'SEC-JEUNES': 'OPPJ',
  'SEC-JEUNE': 'OPPJ',
  'SEC-ADULTES': 'OPPA',
  'SEC-ADULTE': 'OPPA',
};

export interface CatechumeneData {
  id: string | number;
  uuid?: string | null;
  matricule: string;
  nom: string;
  prenoms: string;
  nom_complet: string;
  sexe: 'M' | 'F';
  date_naissance?: string | null;
  telephone?: string | null;
  email?: string | null;
  nom_pere?: string | null;
  nom_mere?: string | null;
  contact_parent?: string | null;
}

export interface CatechumeneItem {
  inscription_id: string | number;
  code_inscription?: string | null;
  date_inscription?: string | null;
  statut_inscription?: string | null;
  catechumene: CatechumeneData | null;
  section: {
    id: number;
    code: SectionCode;
    nom: string;
  } | null;
  niveau: {
    id: number;
    nom: string;
  } | null;
  classe: {
    id: number;
    nom: string;
  } | null;
  annee_catechese: {
    id: number;
    libelle: string;
    statut?: string;
  } | null;
}

export interface CatheoPopulationMeta {
  type_organisation?: string;
  sections_cibles?: SectionCode[] | string[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CatheoPopulationFilterParams {
  search?: string;
  sexe?: 'M' | 'F' | 'tous';
  niveau_id?: number | string;
  classe_id?: number | string;
  page?: number;
  per_page?: number;
}

export interface CatheoStatusSummary {
  catheo_connecte: boolean;
  message?: string;
  annee_catechese?: string;
  total_population?: number;
  total_primaire?: number;
  total_college?: number;
  total_jeunes?: number;
  total_adultes?: number;
  repartition_niveaux?: Array<{
    niveau_id: number;
    niveau: string;
    total: number;
  }>;
  repartition_classes?: Array<{
    classe_id: number;
    classe: string;
    total: number;
  }>;
}
