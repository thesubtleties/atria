import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** Navigation context types */
export type NavContext = 'org' | 'event' | null;

/** UI slice state */
export interface UISliceState {
  // Modals
  activeModals: string[];
  modalData: Record<string, unknown>;
  // Navigation
  sidebarOpen: boolean;
  currentNavContext: NavContext;
}

const initialState: UISliceState = {
  // Modals
  activeModals: [],
  modalData: {},
  // Navigation
  sidebarOpen: false,
  currentNavContext: null,
};

/** Payload for opening a modal */
interface OpenModalPayload {
  modalName: string;
  data?: unknown;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action: PayloadAction<OpenModalPayload>) => {
      const { modalName, data } = action.payload;
      state.activeModals.push(modalName);
      if (data !== undefined) {
        state.modalData[modalName] = data;
      }
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.activeModals = state.activeModals.filter(
        (modal) => modal !== action.payload
      );
      delete state.modalData[action.payload];
    },
    closeAllModals: (state) => {
      state.activeModals = [];
      state.modalData = {};
    },

    // Navigation actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setNavContext: (state, action: PayloadAction<NavContext>) => {
      state.currentNavContext = action.payload;
    },
  },
});

// actions
export const {
  openModal,
  closeModal,
  closeAllModals,
  toggleSidebar,
  setSidebarOpen,
  setNavContext,
} = uiSlice.actions;

// selectors
interface RootStateWithUI {
  ui: UISliceState;
}

export const selectActiveModals = (state: RootStateWithUI) =>
  state.ui.activeModals;
export const selectModalData =
  (modalName: string) => (state: RootStateWithUI) =>
    state.ui.modalData[modalName];
export const selectIsModalOpen =
  (modalName: string) => (state: RootStateWithUI) =>
    state.ui.activeModals.includes(modalName);
export const selectSidebarOpen = (state: RootStateWithUI) =>
  state.ui.sidebarOpen;
export const selectNavContext = (state: RootStateWithUI) =>
  state.ui.currentNavContext;

// reducer
export default uiSlice.reducer;

