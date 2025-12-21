import type { ConnectionStatus, MessageStatus } from './enums';
import type { SocialLinks } from './auth';
import type { Patch } from './utils';

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

/** Direct message thread between two users */
export type DirectMessageThread = {
  id: number;
  user1_id: number;
  user2_id: number;
  last_message_at: string;
  created_at: string;
  updated_at: string | null;

  // Usually populated in response
  other_user?: {
    id: number;
    full_name: string;
    image_url: string | null;
  };
  last_message?: DirectMessage;
  unread_count?: number;
  /** Event IDs shared between both users - ALWAYS present from backend (empty array if none) */
  shared_event_ids: number[];
  other_user_in_event?: boolean;
  is_new?: boolean;
};

/**
 * Thread with event scope metadata for filtering.
 * Extends DirectMessageThread with scope information returned by API.
 * Use this type for threads that can be filtered by event context.
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
  sender?: {
    id: number;
    full_name: string;
    image_url: string | null;
  };
};

/** Direct message creation payload */
export type DirectMessageCreateData = {
  content: string;
  encrypted_content?: string;
};
