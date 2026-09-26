export type ProduitStatut = 'actif' | 'inactif';

export interface ProduitFormuleRef {
  id: number;
  uuid?: string;
  code: string;
  nom: string;
  description: string | null;
  periodicite: 'mensuelle' | 'annuelle';
  montant: number | string;
  devise: string;
  est_gratuite: boolean;
  statut: 'actif' | 'inactif';
  ordre?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Produit {
  id: string; // UUID
  id_interne: number;
  code: string;
  nom: string;
  description: string | null;
  icone: string | null;
  statut: ProduitStatut;
  formules_count?: number;
  organisations_count?: number;
  formules?: ProduitFormuleRef[];
  created_at: string;
  updated_at: string;
}

export interface ProduitFilterParams {
  search?: string;
  statut?: ProduitStatut | 'tous';
  page?: number;
  per_page?: number;
  all?: boolean;
}

export interface ProduitFormData {
  code: string;
  nom: string;
  description?: string | null;
  icone?: string | null;
  statut: ProduitStatut;
}
