import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

// actions
export const { setUser, logout } = authSlice.actions;

// reducer
export default authSlice.reducer;

// selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
