// src/features/ui/store/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    // Modals
    activeModals: [],
    modalData: {},

    // Navigation
    sidebarOpen: false,
    currentNavContext: null, // 'org' | 'event' | null
  },
  reducers: {
    // Modal actions
    openModal: (state, action) => {
      const { modalName, data } = action.payload;
      state.activeModals.push(modalName);
      if (data) {
        state.modalData[modalName] = data;
      }
    },
    closeModal: (state, action) => {
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
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setNavContext: (state, action) => {
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
export const selectActiveModals = (state) => state.ui.activeModals;
export const selectModalData = (modalName) => (state) =>
  state.ui.modalData[modalName];
export const selectIsModalOpen = (modalName) => (state) =>
  state.ui.activeModals.includes(modalName);
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectNavContext = (state) => state.ui.currentNavContext;

// reducer
export default uiSlice.reducer;
