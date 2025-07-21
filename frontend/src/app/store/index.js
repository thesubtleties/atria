// src/app/store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '../features/api';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import chatReducer from './chatSlice';

// Combine all reducers
const appReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  ui: uiReducer,
  chat: chatReducer,
});

// Root reducer that can reset state on logout
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    // Reset the state to initial values
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
