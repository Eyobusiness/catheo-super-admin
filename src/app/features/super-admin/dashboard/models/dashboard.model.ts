/**
 * Modèles réels du Tableau de Bord Super Admin
 * Source de vérité : App\Services\SuperAdmin\SuperAdminDashboardService::getMetrics()
 * Endpoint : GET /api/v1/super-admin/dashboard
 */

export interface DashboardParoissesMetrics {
  total: number;
  actives: number;
}

export interface DashboardAbonnementsMetrics {
  actifs: number;
  en_attente: number;
  suspendus: number;
  expires: number;
  resilies: number;
}

export interface DashboardFinancesMetrics {
  ca_total_encaisse: number;
  ca_mois_courant: number;
  echeances_en_retard: number;
  montant_en_retard: number;
  devise: string;
}

export interface DashboardProduitRepartition {
  produit_id: number;
  produit_code: string;
  produit_nom: string;
  abonnements_actifs: number;
}

export interface DashboardPaiementRecent {
  id: string;
  reference: string;
  montant: number;
  devise: string;
  mode_paiement: string;
  date_paiement: string | null;
  paroisse_nom: string;
  produit_code: string;
}

export interface SuperAdminDashboardData {
  paroisses: DashboardParoissesMetrics;
  produits_actifs: number;
  abonnements: DashboardAbonnementsMetrics;
  finances: DashboardFinancesMetrics;
  repartition_produits: DashboardProduitRepartition[];
  paiements_recents: DashboardPaiementRecent[];
}
