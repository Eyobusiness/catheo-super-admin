import { User } from './auth.models';
import { OrganisationContext } from './organisation.models';

/**
 * Standard API Response envelope matching Laravel backend.
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

/**
 * Pagination metadata returned by Laravel length-aware paginators.
 */
export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

/**
 * Standard Paginated API Response envelope matching Laravel backend.
 */
export interface ApiPaginatedResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: T[];
  meta?: PaginatedMeta;
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
}

/**
 * Standardized API Error for frontend consumption.
 * Ensures security: never exposes raw SQL, stack traces, or server paths.
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Session state interface.
 */
export interface Session {
  token: string | null;
  user: User | null;
  organisation: OrganisationContext | null;
  menus: any[];
  lastActivityAt: number;
}
