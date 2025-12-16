/** Make specific keys of T required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make specific keys of T optional */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Ensure at least one property is present */
export type AtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/** Non-empty partial update type - use for PATCH/PUT payloads to ensure at least one field is provided */
export type Patch<T> = AtLeastOne<Partial<T>>;

/** Component props with children */
export interface WithChildren {
  children: React.ReactNode;
}

/** Component props with optional className */
export interface WithClassName {
  className?: string;
}

/** Common component base props */
export interface BaseComponentProps extends WithClassName {
  id?: string;
  'data-testid'?: string;
}

/** Form field error state */
export interface FieldError {
  message?: string;
  type?: string;
}

/** Generic form state */
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, FieldError>>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Sort configuration */
export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

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
export interface FilterConfig<T> {
  key: keyof T;
  operator: FilterOperator;
  value: unknown;
}
