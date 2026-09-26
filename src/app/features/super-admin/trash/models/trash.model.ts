export interface TrashItem {
  id: string; // uuid
  uuid: string;
  module: string;
  module_key?: string;
  model?: string;
  element: string;
  date_suppression: string;
  deleted_at?: string;
  supprime_par: string;
  item?: Record<string, any>;
}

export interface TrashDetail {
  uuid: string;
  nom?: string;
  element?: string;
  module: string;
  date_suppression: string;
  supprime_par: string;
  dependances?: Record<string, number | string>;
  bouton_restaurer?: boolean;
  apercu_restauration?: {
    nom?: string;
    element?: string;
    module: string;
    date: string;
    supprime_par: string;
    dependances?: Record<string, number | string>;
    bouton_restaurer?: boolean;
  };
}

export interface TrashFilterParams {
  module?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
