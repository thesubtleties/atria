/**
 * Redux store types
 */

import type { User } from './auth';

/** Auth slice state */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authChecked: boolean;
}

/** UI slice state */
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

/** Chat slice state */
export interface ChatState {
  activeRoomId: number | null;
  typingUsers: Record<string, number[]>; // roomId -> userIds
  unreadCounts: Record<string, number>; // roomId -> count
}

/** Root state type - augmented when store is fully typed */
export interface RootState {
  auth: AuthState;
  ui: UIState;
  chat: ChatState;
  // baseApi reducer is added dynamically by RTK Query
}
