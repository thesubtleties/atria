/**
 * Socket.IO event types and payload definitions
 *
 * Defines all client-to-server and server-to-client socket events,
 * their payload types, and callback types for registered handlers.
 */

import type { Socket } from 'socket.io-client';
import type { DirectMessage, DirectMessageThread, ThreadParticipant } from '@/types/networking';
import type { ChatMessage } from '@/types/chat';

// ─────────────────────────────────────────────────────────────────────────────
// Socket Event Names
// ─────────────────────────────────────────────────────────────────────────────

/** Client-to-server socket event names */
export type ClientToServerEvent =
  | 'get_direct_message_threads'
  | 'get_direct_messages'
  | 'send_direct_message'
  | 'mark_messages_read'
  | 'create_direct_message_thread'
  | 'join_user_room'
  | 'join_chat_room'
  | 'leave_chat_room'
  | 'chat_message'
  | 'get_chat_rooms'
  | 'join_event'
  | 'leave_event'
  | 'join_event_admin'
  | 'join_session_chat_rooms'
  | 'leave_session_chat_rooms'
  | 'typing_in_dm';

/** Server-to-client socket event names */
export type ServerToClientEvent =
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'error_response'
  | 'connection_success'
  | 'auth_required'
  | 'auth_error'
  | 'direct_message_threads'
  | 'direct_messages'
  | 'new_direct_message'
  | 'direct_message_sent'
  | 'messages_read'
  | 'direct_message_thread_created'
  | 'chat_room_joined'
  | 'chat_room_left'
  | 'chat_message_moderated'
  | 'chat_message_removed'
  | 'new_chat_message'
  | 'chat_message_sent'
  | 'chat_notification'
  | 'chat_room_created'
  | 'chat_room_updated'
  | 'room_user_count'
  | 'user_joined_room'
  | 'user_left_room'
  | 'chat_rooms'
  | 'typing_in_dm';

// ─────────────────────────────────────────────────────────────────────────────
// Event Payload Types
// ─────────────────────────────────────────────────────────────────────────────

/** Pagination info for socket responses */
export type PaginationInfo = {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
};

/** Direct message threads response payload */
export type DirectMessageThreadsPayload = {
  threads: DirectMessageThread[];
};

/** Direct messages response payload */
export type DirectMessagesPayload = {
  thread_id: number;
  messages: DirectMessage[];
  pagination: PaginationInfo | null;
  other_user: ThreadParticipant | null;
  is_encrypted: boolean;
};

/** New direct message payload (same as DirectMessage) */
export type NewDirectMessagePayload = DirectMessage;

/** Messages read notification payload */
export type MessagesReadPayload = {
  thread_id: number;
  reader_id: number;
};

/** Chat room joined payload */
export type ChatRoomJoinedPayload = {
  room_id: number;
  room_name: string;
  messages: ChatMessage[];
  user_count: number;
};

/** Chat room left payload */
export type ChatRoomLeftPayload = {
  room_id: number;
};

/** Chat message moderated payload (admin-only) */
export type ChatMessageModeratedPayload = {
  message_id: number;
  room_id: number;
  deleted_by: {
    id: number;
    full_name: string;
  };
};

/** Chat message removed payload */
export type ChatMessageRemovedPayload = {
  message_id: number;
  room_id: number;
};

/** Chat notification payload */
export type ChatNotificationPayload = {
  room_id: number;
  event_id: number;
  unread_count: number;
  latest_message: ChatMessage | null;
  updated_at: string;
};

/** Chat room created payload */
export type ChatRoomCreatedPayload = {
  room_id: number;
  event_id: number;
};

/** Chat room updated payload */
export type ChatRoomUpdatedPayload = {
  room_id: number;
  event_id: number;
  updates: Partial<{
    name: string;
    description: string | null;
    is_enabled: boolean;
    display_order: number;
  }>;
};

/** Room user count update payload */
export type RoomUserCountPayload = {
  room_id: number;
  user_count: number;
};

/** User joined room payload */
export type UserJoinedRoomPayload = {
  room_id: number;
  user_id: number;
};

/** User left room payload */
export type UserLeftRoomPayload = {
  room_id: number;
  user_id: number;
};

/** Chat rooms list payload */
export type ChatRoomsPayload = {
  chat_rooms: Array<{
    id: number;
    name: string;
    event_id: number;
    session_id: number | null;
    unread_count: number;
    latest_message: ChatMessage | null;
    updated_at: string;
  }>;
};

/** Typing indicator in DM payload */
export type TypingInDMPayload = {
  thread_id: number;
  user_id: number;
  is_typing: boolean;
};

/** Error response payload */
export type ErrorPayload = {
  message: string;
};

/** Auth payload */
export type AuthPayload = {
  message?: string;
};

/** Connection success payload */
export type ConnectionSuccessPayload = {
  message?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Callback Types
// ─────────────────────────────────────────────────────────────────────────────

/** Direct message callback event */
export type DirectMessageCallbackEvent =
  | {
      type: 'new_message';
      message: DirectMessage;
    }
  | {
      type: 'message_moderated';
      messageId: number;
      deleted_by: { id: number; full_name: string } | null;
      deleted_at: string | null;
    }
  | {
      type: 'message_removed';
      messageId: number;
    };

/** Direct message callback function */
export type DirectMessageCallback = (event: DirectMessageCallbackEvent) => void;

/** Chat message callback event */
export type ChatMessageCallbackEvent =
  | {
      type: 'new_message';
      message: ChatMessage;
    }
  | {
      type: 'message_moderated';
      messageId: number;
      deleted_by: { id: number; full_name: string } | null;
      deleted_at: string | null;
    }
  | {
      type: 'message_removed';
      messageId: number;
    };

/** Chat message callback function */
export type ChatMessageCallback = (event: ChatMessageCallbackEvent) => void;

/** Typing callback data */
export type TypingCallbackData = {
  type: 'typing_status';
  thread_id: number;
  user_id: number;
  is_typing: boolean;
};

/** Typing callback function */
export type TypingCallback = (data: TypingCallbackData) => void;

/** Room presence callback data */
export type RoomPresenceCallbackData = {
  type: 'user_count_update';
  room_id: number;
  user_count: number;
};

/** Room presence callback function */
export type RoomPresenceCallback = (data: RoomPresenceCallbackData) => void;

// ─────────────────────────────────────────────────────────────────────────────
// Socket Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

/** Socket.IO client options (re-exported from socket.io-client) */
export type { SocketOptions } from 'socket.io-client';

/** Socket type (re-exported from socket.io-client) */
export type { Socket };

// ─────────────────────────────────────────────────────────────────────────────
// Window Interface Extension
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    socket?: Socket | null;
  }
}
