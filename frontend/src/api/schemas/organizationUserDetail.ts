/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Atria API
 * OpenAPI spec version: 1.0.0
 */
import type { OrganizationUserDetailRole } from "./organizationUserDetailRole";
import type { OrganizationBase } from "./organizationBase";
import type { UserBase1 } from "./userBase1";

export interface OrganizationUserDetail {
  readonly user_name?: string;
  readonly is_owner?: boolean;
  readonly is_admin?: boolean;
  image_url?: string;
  organization_id: number;
  user_id: number;
  /** @maxLength 6 */
  role: OrganizationUserDetailRole;
  /** @nullable */
  created_at?: string | null;
  readonly organization?: OrganizationBase;
  readonly user?: UserBase1;
}
