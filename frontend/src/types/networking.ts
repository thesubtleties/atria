/**
 * Networking and connection types
 *
 * Convention: Response types use `| null` for nullable API fields.
 */

import type { ConnectionStatus, MessageStatus } from './enums';
import type { SocialLinks } from './auth';
import type { Patch } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
// Connections
// ─────────────────────────────────────────────────────────────────────────────

/** User info in connection response (privacy-filtered) */
export type ConnectionUser = {
  id: number;
  full_name: string;
  email: string | null; // May be hidden based on privacy settings
  image_url: string | null;
  company_name: string | null;
  title: string | null;
  social_links: SocialLinks | null;
};

/** Connection between users */
export type Connection = {
  id: number;
  requester_id: number;
  recipient_id: number;
  status: ConnectionStatus;
  icebreaker_message: string;
  originating_event_id: number | null;
  created_at: string;
  updated_at: string | null;
  requester: ConnectionUser;
  recipient: ConnectionUser;
  originating_event: {
    id: number;
    title: string;
  } | null;
};

/** Connection request creation payload */
export type ConnectionCreateData = {
  recipient_id: number;
  icebreaker_message: string;
  originating_event_id?: number;
};

/** Connection update payload - requires at least one field */
export type ConnectionUpdateData = Patch<{ status: ConnectionStatus }>;

// ─────────────────────────────────────────────────────────────────────────────
// Direct Messages
// ─────────────────────────────────────────────────────────────────────────────

/** Other user in thread */
export type ThreadParticipant = {
  id: number;
  full_name: string;
  image_url: string | null;
};

/** Direct message thread between two users */
export type DirectMessageThread = {
  id: number;
  user1_id: number;
  user2_id: number;
  last_message_at: string;
  created_at: string;
  updated_at: string | null;
  // Populated by API - null if not included
  other_user: ThreadParticipant | null;
  last_message: DirectMessage | null;
  unread_count: number;
  shared_event_ids?: number[]; // Optional - empty array if none
  other_user_in_event?: boolean; // Optional
  is_new?: boolean; // Optional
};

/**
 * Thread with event scope metadata for filtering.
 * Extends DirectMessageThread with scope information returned by API.
 */
export type FilterableThread = DirectMessageThread & {
  /** Event ID this thread is scoped to, or null for global threads */
  event_scope_id: number | null;
};

/** Direct message in a thread */
export type DirectMessage = {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  encrypted_content: string | null;
  status: MessageStatus;
  created_at: string;
  // Populated by API - null if not included
  sender: ThreadParticipant | null;
};

/** Direct message creation payload */
export type DirectMessageCreateData = {
  content: string;
  encrypted_content?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────────────────────

/** Check if connection is pending */
export function isPendingConnection(connection: Connection): boolean {
  return connection.status === 'PENDING';
}

/** Check if connection is accepted */
export function isAcceptedConnection(connection: Connection): boolean {
  return connection.status === 'ACCEPTED';
}

/** Check if thread has unread messages */
export function hasUnreadMessages(thread: DirectMessageThread): boolean {
  return thread.unread_count > 0;
}
