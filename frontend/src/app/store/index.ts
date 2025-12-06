import {
  configureStore,
  combineReducers,
  type Reducer,
  type UnknownAction,
} from '@reduxjs/toolkit';
import { baseApi } from '../features/api';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import chatReducer from './chatSlice';
import type { AuthState } from '@/types';
import type { UISliceState } from './uiSlice';
import type { ChatSliceState } from './chatSlice';

/** Combined app state shape */
interface AppState {
  [baseApi.reducerPath]: ReturnType<typeof baseApi.reducer>;
  auth: AuthState;
  ui: UISliceState;
  chat: ChatSliceState;
}

// Combine all reducers
const appReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  ui: uiReducer,
  chat: chatReducer,
});

// Root reducer that can reset state on logout
const rootReducer: Reducer<AppState, UnknownAction> = (state, action) => {
  if (action.type === 'auth/logout') {
    console.log('🔄 LOGOUT: Resetting entire Redux state');

    // Reset the state to initial values
    const clearedState = undefined;

    // Create a new state with empty API cache
    const newState = appReducer(clearedState, action);
    if (newState && baseApi.reducerPath) {
      (newState as Record<string, unknown>)[baseApi.reducerPath] =
        baseApi.reducer(undefined, { type: '@@INIT' });
    }

    console.log('🔄 LOGOUT: RTK Query cache manually cleared');
    return newState;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

// Infer the RootState and AppDispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

