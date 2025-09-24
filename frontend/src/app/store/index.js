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
    console.log('🔄 LOGOUT: Resetting entire Redux state');
    
    // Reset the state to initial values
    state = undefined;
    
    // Create a new state with empty API cache
    const newState = appReducer(state, action);
    if (newState && baseApi.reducerPath) {
      newState[baseApi.reducerPath] = baseApi.reducer(undefined, { type: '@@INIT' });
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
