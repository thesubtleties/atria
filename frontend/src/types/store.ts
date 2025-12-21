/**
 * Redux store types
 *
 * Note: RootState and AppDispatch are exported from @/app/store
 * This file contains the slice state interfaces for reference.
 */

import type { User } from './auth';

/** Auth slice state */
export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  authChecked: boolean;
};

// Re-export RootState and AppDispatch from the actual store
export type { RootState, AppDispatch } from '@/app/store';
