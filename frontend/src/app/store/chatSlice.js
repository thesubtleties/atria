// src/app/store/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarExpanded: false,
  activeThreads: [], // IDs of open chat windows
  minimizedThreads: [], // IDs of minimized chat windows
  currentEventId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarExpanded = !state.sidebarExpanded;
    },
    openThread: (state, action) => {
      const threadId = action.payload;
      // Remove from minimized if it was there
      state.minimizedThreads = state.minimizedThreads.filter(
        (id) => id !== threadId
      );

      // Add to active if not already there
      if (!state.activeThreads.includes(threadId)) {
        // Limit to 3 active windows (like LinkedIn)
        if (state.activeThreads.length >= 3) {
          // Move oldest to minimized
          const oldestThread = state.activeThreads.shift();
          state.minimizedThreads.push(oldestThread);
        }
        state.activeThreads.push(threadId);
      }
    },
    closeThread: (state, action) => {
      const threadId = action.payload;
      state.activeThreads = state.activeThreads.filter((id) => id !== threadId);
      state.minimizedThreads = state.minimizedThreads.filter(
        (id) => id !== threadId
      );
    },
    minimizeThread: (state, action) => {
      const threadId = action.payload;
      // Remove from active
      state.activeThreads = state.activeThreads.filter((id) => id !== threadId);
      // Add to minimized if not already there
      if (!state.minimizedThreads.includes(threadId)) {
        state.minimizedThreads.push(threadId);
      }
    },
    maximizeThread: (state, action) => {
      const threadId = action.payload;
      // Remove from minimized
      state.minimizedThreads = state.minimizedThreads.filter(
        (id) => id !== threadId
      );
      // Add to active if not already there
      if (!state.activeThreads.includes(threadId)) {
        // Limit to 3 active windows (like LinkedIn)
        if (state.activeThreads.length >= 3) {
          // Move oldest to minimized
          const oldestThread = state.activeThreads.shift();
          state.minimizedThreads.push(oldestThread);
        }
        state.activeThreads.push(threadId);
      }
    },
    setCurrentEventId: (state, action) => {
      state.currentEventId = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  openThread,
  closeThread,
  minimizeThread,
  maximizeThread,
  setCurrentEventId,
} = chatSlice.actions;

// Selectors
export const selectSidebarExpanded = (state) => state.chat.sidebarExpanded;
export const selectActiveThreads = (state) => state.chat.activeThreads;
export const selectMinimizedThreads = (state) => state.chat.minimizedThreads;
export const selectCurrentEventId = (state) => state.chat.currentEventId;

export default chatSlice.reducer;
