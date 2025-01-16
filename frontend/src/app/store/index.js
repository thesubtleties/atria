import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/features/api';
import { authSlice } from '@/features/auth/store/authSlice';
import { uiSlice } from '@/features/ui/store/uiSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
