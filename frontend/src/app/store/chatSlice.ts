import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** Chat tab types for mobile navigation */
export type ChatTab = 'general' | 'event' | 'chat' | 'session';

/** Chat slice state */
export type ChatSliceState = {
  sidebarExpanded: boolean;
  activeThreads: number[]; // IDs of open chat windows
  minimizedThreads: number[]; // IDs of minimized chat windows
  currentEventId: number | null;
  // Mobile chat state
  activeTab: ChatTab;
  activeChatRoomId: number | null; // Currently open chat room ID
  lastSessionId: number | null; // Remember last viewed session
  mobileActiveThreadId: number | null; // Active thread ID for mobile view
};

const initialState: ChatSliceState = {
  sidebarExpanded: false,
  activeThreads: [],
  minimizedThreads: [],
  currentEventId: null,
  // Mobile chat state
  activeTab: 'general',
  activeChatRoomId: null,
  lastSessionId: null,
  mobileActiveThreadId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarExpanded = !state.sidebarExpanded;
    },
    openThread: (state, action: PayloadAction<number>) => {
      const threadId = action.payload;
      // Remove from minimized if it was there
      state.minimizedThreads = state.minimizedThreads.filter((id) => id !== threadId);

      // Add to active if not already there
      if (!state.activeThreads.includes(threadId)) {
        // Limit to 3 active windows (like LinkedIn)
        if (state.activeThreads.length >= 3) {
          // Move oldest to minimized
          const oldestThread = state.activeThreads.shift();
          if (oldestThread !== undefined) {
            state.minimizedThreads.push(oldestThread);
          }
        }
        state.activeThreads.push(threadId);
      }
    },
    closeThread: (state, action: PayloadAction<number>) => {
      const threadId = action.payload;
      state.activeThreads = state.activeThreads.filter((id) => id !== threadId);
      state.minimizedThreads = state.minimizedThreads.filter((id) => id !== threadId);
    },
    minimizeThread: (state, action: PayloadAction<number>) => {
      const threadId = action.payload;
      // Remove from active
      state.activeThreads = state.activeThreads.filter((id) => id !== threadId);
      // Add to minimized if not already there
      if (!state.minimizedThreads.includes(threadId)) {
        state.minimizedThreads.push(threadId);
      }
    },
    maximizeThread: (state, action: PayloadAction<number>) => {
      const threadId = action.payload;
      // Remove from minimized
      state.minimizedThreads = state.minimizedThreads.filter((id) => id !== threadId);
      // Add to active if not already there
      if (!state.activeThreads.includes(threadId)) {
        // Limit to 3 active windows (like LinkedIn)
        if (state.activeThreads.length >= 3) {
          // Move oldest to minimized
          const oldestThread = state.activeThreads.shift();
          if (oldestThread !== undefined) {
            state.minimizedThreads.push(oldestThread);
          }
        }
        state.activeThreads.push(threadId);
      }
    },
    setCurrentEventId: (state, action: PayloadAction<number | null>) => {
      console.log(
        '🔴 Redux: setCurrentEventId called with:',
        action.payload,
        'type:',
        typeof action.payload,
      );
      state.currentEventId = action.payload;
      console.log('🔴 Redux: currentEventId now set to:', state.currentEventId);
    },
    // Mobile chat tab actions
    setActiveTab: (state, action: PayloadAction<ChatTab>) => {
      state.activeTab = action.payload;
    },
    setActiveChatRoomId: (state, action: PayloadAction<number | null>) => {
      state.activeChatRoomId = action.payload;
    },
    setLastSessionId: (state, action: PayloadAction<number | null>) => {
      state.lastSessionId = action.payload;
    },
    // Mobile-specific action for opening threads
    openThreadMobile: (state, action: PayloadAction<number>) => {
      const threadId = action.payload;
      state.mobileActiveThreadId = threadId;
      // Automatically expand sidebar when opening a thread on mobile
      state.sidebarExpanded = true;
    },
    closeThreadMobile: (state) => {
      state.mobileActiveThreadId = null;
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
  setActiveTab,
  setActiveChatRoomId,
  setLastSessionId,
  openThreadMobile,
  closeThreadMobile,
} = chatSlice.actions;

// Selectors
type RootStateWithChat = {
  chat: ChatSliceState;
};

export const selectSidebarExpanded = (state: RootStateWithChat) => state.chat.sidebarExpanded;
export const selectActiveThreads = (state: RootStateWithChat) => state.chat.activeThreads;
export const selectMinimizedThreads = (state: RootStateWithChat) => state.chat.minimizedThreads;
export const selectCurrentEventId = (state: RootStateWithChat) => state.chat.currentEventId;
export const selectActiveTab = (state: RootStateWithChat) => state.chat.activeTab;
export const selectActiveChatRoomId = (state: RootStateWithChat) => state.chat.activeChatRoomId;
export const selectLastSessionId = (state: RootStateWithChat) => state.chat.lastSessionId;
export const selectMobileActiveThreadId = (state: RootStateWithChat) =>
  state.chat.mobileActiveThreadId;

export default chatSlice.reducer;
