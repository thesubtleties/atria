import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthState, UserProfileUpdate, SocialLinks } from '@/types';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  authChecked: false,
};

/** Profile update payload with computed full_name */
type ProfileUpdatePayload = UserProfileUpdate & { full_name?: string };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.authChecked = true;
    },
    updateUserProfile: (state, action: PayloadAction<ProfileUpdatePayload>) => {
      if (state.user) {
        const { social_links, ...rest } = action.payload;
        // Merge social_links properly (partial update)
        const mergedSocialLinks: SocialLinks | undefined =
          social_links ? { ...state.user.social_links, ...social_links } : undefined;

        state.user = {
          ...state.user,
          ...rest,
          ...(mergedSocialLinks && { social_links: mergedSocialLinks }),
        };
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true;
    },
  },
});

// actions
export const { setUser, updateUserProfile, logout } = authSlice.actions;

// reducer
export default authSlice.reducer;

// selectors
type RootStateWithAuth = {
  auth: AuthState;
};

export const selectUser = (state: RootStateWithAuth) => state.auth.user;
export const selectIsAuthenticated = (state: RootStateWithAuth) => state.auth.isAuthenticated;
export const selectAuthChecked = (state: RootStateWithAuth) => state.auth.authChecked;
