/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Atria API
 * OpenAPI spec version: 1.0.0
 */

export type SessionUpdateStatus =
  (typeof SessionUpdateStatus)[keyof typeof SessionUpdateStatus];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const SessionUpdateStatus = {
  SCHEDULED: "SCHEDULED",
  STARTING_SOON: "STARTING_SOON",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
