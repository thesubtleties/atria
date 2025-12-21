/**
 * Organization-related types
 *
 * Convention: Response types use `| null` for nullable API fields.
 */

import type { OrganizationUserRole } from './enums';
import type { EventNested } from './events';
import type { Patch } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
// Organization Types
// ─────────────────────────────────────────────────────────────────────────────

/** Organization user nested in organization response */
export type OrganizationUserNested = {
  id: number;
  full_name: string;
  email: string;
  role: OrganizationUserRole;
};

/** Core organization model */
export type Organization = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string | null;
  users: OrganizationUserNested[];
};

/** Detailed organization with computed properties */
export type OrganizationDetail = Organization & {
  member_count: number;
  owner_count: number;
  user_is_admin_or_owner: boolean;
  current_user_role: OrganizationUserRole | null;
  upcoming_events: EventNested[];
  // Credential status flags (visible to all org members)
  has_mux_credentials: boolean;
  has_mux_signing_credentials: boolean;
  has_jaas_credentials: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// API Payloads
// ─────────────────────────────────────────────────────────────────────────────

/** Organization creation payload */
export type OrganizationCreateData = {
  name: string;
};

/** Organization update payload - requires at least one field */
export type OrganizationUpdateData = Patch<{ name: string }>;

/** Organization user role update payload */
export type OrganizationUserRoleUpdateData = {
  role: OrganizationUserRole;
};

/** Add user to organization payload */
export type OrganizationAddUserData = {
  user_id: number;
  role: OrganizationUserRole;
};

/** Mux credentials set payload (owner/admin only) */
export type OrganizationMuxCredentialsData = {
  mux_token_id?: string | null;
  mux_token_secret?: string | null;
  mux_signing_key_id?: string | null;
  mux_signing_private_key?: string | null;
};

/** JaaS credentials set payload (owner/admin only) */
export type OrganizationJaasCredentialsData = {
  jaas_app_id: string;
  jaas_api_key: string;
  jaas_private_key: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────────────────────

/** Check if user is organization owner */
export function isOrganizationOwner(user: OrganizationUserNested): boolean {
  return user.role === 'OWNER';
}

/** Check if user can manage organization (owner or admin) */
export function canManageOrganization(user: OrganizationUserNested): boolean {
  return user.role === 'OWNER' || user.role === 'ADMIN';
}

/** Check if organization has streaming capabilities */
export function hasStreamingCredentials(org: OrganizationDetail): boolean {
  return org.has_mux_credentials || org.has_jaas_credentials;
}
