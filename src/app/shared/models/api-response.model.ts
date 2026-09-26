import type { ApiPaginatedResponse } from '../../core/models/api.models';

export type {
  ApiResponse,
  ApiPaginatedResponse,
  PaginatedMeta,
  ApiError,
  Session,
} from '../../core/models/api.models';

export type PaginatedResponse<T = any> = ApiPaginatedResponse<T>;
