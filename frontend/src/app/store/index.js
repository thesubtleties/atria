// src/app/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../features/api';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    ui: uiReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
