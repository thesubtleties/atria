import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthState } from '@/types';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  authChecked: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.authChecked = true;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
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
