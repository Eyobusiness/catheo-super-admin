export interface PaginationState {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  from?: number;
  to?: number;
}

export interface PageChangeEvent {
  page: number;
  perPage: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}
