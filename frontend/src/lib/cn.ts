/**
 * Utility for joining class names, filtering out undefined values.
 * This handles the interaction between CSS modules (which return string | undefined
 * due to noUncheckedIndexedAccess) and Mantine components (which require string
 * due to exactOptionalPropertyTypes).
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
