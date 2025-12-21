/**
 * Utility types for the Atria frontend
 *
 * Conventions:
 * - Use `| null` for "value does not exist" (API responses, database fields)
 * - Use `?:` only for optional function/component parameters
 * - Prefer type narrowing over type assertions
 */

// ─────────────────────────────────────────────────────────────────────────────
// Type Manipulation Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Make specific keys of T required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make specific keys of T optional */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make all properties nullable (T | null) */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/** Make specific keys nullable */
export type NullableKeys<T, K extends keyof T> = Omit<T, K> & { [P in K]: T[P] | null };

/** Extract non-null type */
export type NonNull<T> = T extends null ? never : T;

/** Ensure at least one property is present */
export type AtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/** Non-empty partial update type - use for PATCH/PUT payloads */
export type Patch<T> = AtLeastOne<Partial<T>>;

/** Deep partial - all nested properties become optional */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/** Pick only properties of a certain type */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/** Omit properties of a certain type */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards (for narrowing)
// ─────────────────────────────────────────────────────────────────────────────

/** Check if value is not null or undefined */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/** Check if value is null or undefined */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Check if string is non-empty */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Check if array is non-empty */
export function isNonEmptyArray<T>(value: T[] | null | undefined): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/** Check if object has a specific property */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K,
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/** Assert value is defined, throw if not */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Expected value to be defined');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────────────────────────────────────

/** Component props with children */
export type WithChildren = {
  children: React.ReactNode;
};

/** Component props with optional className */
export type WithClassName = {
  className?: string;
};

/** Common component base props */
export type BaseComponentProps = WithClassName & {
  id?: string;
  'data-testid'?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Form Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Form field error state */
export type FieldError = {
  message: string | null;
  type: string | null;
};

/** Generic form state */
export type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, FieldError>>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Sorting & Filtering
// ─────────────────────────────────────────────────────────────────────────────

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Sort configuration */
export type SortConfig<T> = {
  key: keyof T;
  direction: SortDirection;
};

/** Filter operator types */
export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

/** Generic filter configuration */
export type FilterConfig<T> = {
  key: keyof T;
  operator: FilterOperator;
  value: unknown;
};

// ─────────────────────────────────────────────────────────────────────────────
// Branded Types (for type-safe IDs)
// ─────────────────────────────────────────────────────────────────────────────

/** Brand a type to create nominal typing */
declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };

/** Branded number ID types */
export type UserId = Brand<number, 'UserId'>;
export type EventId = Brand<number, 'EventId'>;
export type SessionId = Brand<number, 'SessionId'>;
export type OrganizationId = Brand<number, 'OrganizationId'>;
