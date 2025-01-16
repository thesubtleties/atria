/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Atria API
 * OpenAPI spec version: 1.0.0
 */
import type { EventDetailEventType } from "./eventDetailEventType";
import type { EventDetailStatus } from "./eventDetailStatus";
import type { OrganizationBase } from "./organizationBase";
import type { SessionBase1 } from "./sessionBase1";
import type { UserBase1 } from "./userBase1";
import type { UserBase2 } from "./userBase2";

export interface EventDetail {
  readonly is_published?: boolean;
  readonly is_upcoming?: boolean;
  readonly is_ongoing?: boolean;
  readonly is_past?: boolean;
  readonly day_count?: number;
  id?: number;
  organization_id: number;
  title: string;
  /** @nullable */
  description?: string | null;
  /** @maxLength 14 */
  event_type: EventDetailEventType;
  start_date: string;
  end_date: string;
  company_name: string;
  slug: string;
  /** @maxLength 9 */
  status?: EventDetailStatus;
  branding?: unknown;
  /** @nullable */
  created_at?: string | null;
  /** @nullable */
  updated_at?: string | null;
  readonly organization?: OrganizationBase;
  readonly sessions?: readonly SessionBase1[];
  readonly organizers?: readonly UserBase1[];
  readonly speakers?: readonly UserBase2[];
}
