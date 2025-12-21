/** Standard API error response shape */
export type ApiError = {
  status?: number;
  data?: {
    message?: string;
    errors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  message?: string;
};

/** Paginated API response wrapper */
export type PaginatedResponse<T> = {
  items?: T[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  self?: string;
  first?: string;
  last?: string;
  next?: string;
  prev?: string;
};

/** Common query parameters for paginated endpoints */
export type PaginationParams = {
  page?: number;
  per_page?: number;
};

/** Base query request shape for axios base query */
export type BaseQueryRequest = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  data?: unknown;
  params?: Record<string, unknown>;
};

/** RTK Query result shapes */
export type QueryResult<T> = { data: T; error?: undefined } | { data?: undefined; error: ApiError };

/** Upload response from the API */
export type UploadResponse = {
  url: string;
  filename: string;
  content_type?: string;
  size?: number;
};
