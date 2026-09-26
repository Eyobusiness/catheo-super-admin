export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  badge?: boolean;
  formatter?: (val: any, row: T) => string;
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TableRowAction<T = any> {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info';
  permission?: string;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}
