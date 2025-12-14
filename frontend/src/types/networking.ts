import type { ConnectionStatus, MessageStatus } from './enums';
import type { SocialLinks } from './auth';

/** User info in connection response (privacy-filtered) */
export interface ConnectionUser {
  id: number;
  full_name: string;
  email: string | null; // May be hidden based on privacy settings
  image_url: string | null;
  company_name: string | null;
  title: string | null;
  social_links: SocialLinks | null;
}

/** Connection between users */
export interface Connection {
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
}

/** Connection request creation payload */
export interface ConnectionCreateData {
  recipient_id: number;
  icebreaker_message: string;
  originating_event_id?: number;
}

/** Connection update payload */
export interface ConnectionUpdateData {
  status: ConnectionStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct Messages
// ─────────────────────────────────────────────────────────────────────────────

/** Direct message thread between two users */
export interface DirectMessageThread {
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
}

/** Direct message in a thread */
export interface DirectMessage {
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
}

/** Direct message creation payload */
export interface DirectMessageCreateData {
  content: string;
  encrypted_content?: string;
}
