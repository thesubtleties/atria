import type { ChatRoomType } from './enums';
import type { Patch } from './utils';

/** Chat room */
export type ChatRoom = {
  id: number;
  event_id: number;
  session_id: number | null;
  name: string;
  description: string | null;
  room_type: ChatRoomType;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string | null;
};

/** Detailed chat room with relationships */
export type ChatRoomDetail = ChatRoom & {
  event: {
    id: number;
    title: string;
  };
  session: {
    id: number;
    title: string;
  } | null;
};

/** Chat room with message count (for session chat) */
export type SessionChatRoom = ChatRoom & {
  message_count: number;
};

/** Chat room for admin view with metadata */
export type ChatRoomAdmin = ChatRoomDetail & {
  message_count: number;
  participant_count: number;
  last_activity: string | null;
};

/** Chat room creation payload */
export type ChatRoomCreateData = {
  name: string;
  description?: string;
  room_type?: ChatRoomType;
  is_enabled?: boolean;
};

/** Mutable fields for chat room updates */
type ChatRoomMutableFields = {
  name: string;
  description: string | null;
  is_enabled: boolean;
  display_order: number;
};

/** Chat room update payload - requires at least one field */
export type ChatRoomUpdateData = Patch<ChatRoomMutableFields>;

// ─────────────────────────────────────────────────────────────────────────────
// Chat Messages
// ─────────────────────────────────────────────────────────────────────────────

/** Chat message */
export type ChatMessage = {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  created_at: string;
  deleted_at: string | null;
  deleted_by_id: number | null;
  is_deleted: boolean;
  user: {
    id: number;
    full_name: string;
    image_url: string | null;
  };
  deleted_by: {
    id: number;
    full_name: string;
  } | null;
};

/** Chat message creation payload */
export type ChatMessageCreateData = {
  content: string;
};

/** Chat message for real-time socket events - subset of ChatMessage */
export type ChatMessageSocket = Pick<
  ChatMessage,
  'id' | 'room_id' | 'user_id' | 'content' | 'created_at' | 'user'
>;
