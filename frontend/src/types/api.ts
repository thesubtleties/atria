/**
 * API-related types for RTK Query and HTTP requests
 *
 * Convention: Response types use `| null` for nullable fields.
 * Request/param types use `?:` for optional parameters.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Error Types
// ─────────────────────────────────────────────────────────────────────────────

/** Standard API error response shape */
export type ApiError = {
  status: number | null;
  data: {
    message: string | null;
    errors: Record<string, string[]> | null;
  } | null;
  message: string | null;
};

/** Type guard for API errors */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || 'data' in error || 'message' in error)
  );
}

/** Extract error message from API error */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (isApiError(error)) {
    return error.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

/** Paginated API response wrapper */
export type PaginatedResponse<T> = {
  items: T[];
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  // HATEOAS links (null when not applicable)
  self: string | null;
  first: string | null;
  last: string | null;
  next: string | null;
  prev: string | null;
};

/** Common query parameters for paginated endpoints */
export type PaginationParams = {
  page?: number;
  per_page?: number;
};

/** Check if there are more pages */
export function hasNextPage<T>(response: PaginatedResponse<T>): boolean {
  return response.current_page < response.total_pages;
}

/** Check if on first page */
export function isFirstPage<T>(response: PaginatedResponse<T>): boolean {
  return response.current_page === 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────────────────────────

/** HTTP methods */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Base query request shape for axios base query */
export type BaseQueryRequest = {
  url: string;
  method?: HttpMethod;
  body?: unknown;
  data?: unknown;
  params?: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────────────────

/** RTK Query result shapes */
export type QueryResult<T> = { data: T; error: null } | { data: null; error: ApiError };

/** Upload response from the API */
export type UploadResponse = {
  url: string;
  object_key: string;
  bucket: string;
  context: string;
};

/** Generic success response */
export type SuccessResponse = {
  message: string;
  success: true;
};

/** Bulk operation result */
export type BulkOperationResult<T = unknown> = {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  total: number;
  success_count: number;
  failure_count: number;
};
