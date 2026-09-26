export type Periodicite = 'mensuelle' | 'annuelle';
export type FormuleStatut = 'actif' | 'inactif';

export interface FormuleProduitRef {
  id: string; // UUID
  id_interne?: number;
  code: string;
  nom: string;
  icone?: string | null;
  statut?: string;
}

export interface Formule {
  id: number;
  uuid?: string;
  produit_id: string | number;
  code: string;
  nom: string;
  description: string | null;
  periodicite: Periodicite;
  montant: number | string;
  devise: string;
  est_gratuite: boolean;
  statut: FormuleStatut;
  ordre: number;
  produit_code?: string;
  produit_nom?: string;
  produit?: FormuleProduitRef;
  created_at: string;
  updated_at: string;
}

export interface FormuleFilterParams {
  produit?: string;
  produit_id?: string | number;
  statut?: FormuleStatut | 'tous';
  est_gratuite?: boolean;
  all?: boolean;
  page?: number;
  per_page?: number;
}

export interface FormuleFormData {
  produit_id: string | number;
  code: string;
  nom: string;
  description?: string | null;
  periodicite: Periodicite;
  montant: number;
  devise: string;
  est_gratuite: boolean;
  statut: FormuleStatut;
  ordre?: number;
}
