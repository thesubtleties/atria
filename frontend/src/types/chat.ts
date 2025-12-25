/**
 * Chat-related types
 *
 * Convention: Response types use `| null` for nullable API fields.
 */

import type { ChatRoomType } from './enums';
import type { Patch } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
// Chat Rooms
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Chat Messages
// ─────────────────────────────────────────────────────────────────────────────

/** User info in chat context */
export type ChatUser = {
  id: number;
  full_name: string;
  image_url: string | null;
};

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
  user: ChatUser;
  deleted_by: Pick<ChatUser, 'id' | 'full_name'> | null;
};

/** Chat message for real-time socket events - subset of ChatMessage */
export type ChatMessageSocket = Pick<
  ChatMessage,
  'id' | 'room_id' | 'user_id' | 'content' | 'created_at' | 'user'
>;

// ─────────────────────────────────────────────────────────────────────────────
// API Payloads
// ─────────────────────────────────────────────────────────────────────────────

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

/** Chat message creation payload */
export type ChatMessageCreateData = {
  content: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────────────────────

/** Check if chat room is session-specific */
export function isSessionRoom(room: ChatRoom): room is ChatRoom & { session_id: number } {
  return room.session_id !== null;
}

/** Check if chat room is event-wide */
export function isEventRoom(room: ChatRoom): boolean {
  return room.session_id === null;
}

/** Check if message was deleted */
export function isDeletedMessage(message: ChatMessage): boolean {
  return message.is_deleted || message.deleted_at !== null;
}

/** Check if room is public type */
export function isPublicRoom(room: ChatRoom): boolean {
  return room.room_type === 'PUBLIC' || room.room_type === 'GLOBAL';
}

/** Check if room is backstage/private type */
export function isPrivateRoom(room: ChatRoom): boolean {
  return (
    room.room_type === 'BACKSTAGE' || room.room_type === 'ADMIN' || room.room_type === 'GREEN_ROOM'
  );
}
