export type ExportDomain =
  | 'membres'
  | 'activites'
  | 'catheo'
  | 'pelerinages'
  | 'caisse'
  | 'statistiques'
  | 'rapport';

export type TypeExportPelerinage = 'general' | 'transport' | 'embarquement' | 'hebergement';

export interface ExportMembresFilters {
  statut?: string;
  sexe?: string;
  fonction?: string;
}

export interface ExportActivitesFilters {
  statut?: string;
  type_activite?: string;
}

export interface ExportPelerinagesFilters {
  campagne_id: number | string;
  statut_inscription?: string;
  statut_participation?: string;
  type_export?: TypeExportPelerinage;
}

export interface ExportCaisseFilters {
  type_operation?: string;
  date_debut?: string;
  date_fin?: string;
}

export interface ExportItemOption {
  id: ExportDomain;
  title: string;
  description: string;
  icon: string;
  permission: string;
  supportsCsv: boolean;
  supportsPrint: boolean;
}
