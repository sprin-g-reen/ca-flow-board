
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BoardViewType = 'kanban' | 'list';
export type ThemeMode = 'light' | 'dark';

interface UIState {
  sidebarCollapsed: boolean;
  boardView: BoardViewType;
  theme: ThemeMode;
  notificationsUnread: number;
  activeFilters: {
    status?: string[];
    priority?: string[];
    category?: string[];
    assignedTo?: string[];
    dueDate?: string;
  };
  modals: {
    addClient: boolean;
    addEmployee: boolean;
    addTask: boolean;
    addInvoice: boolean;
    addEvent: boolean;
  }
}

const initialState: UIState = {
  sidebarCollapsed: false,
  boardView: 'kanban',
  theme: 'light',
  notificationsUnread: 3,
  activeFilters: {},
  modals: {
    addClient: false,
    addEmployee: false,
    addTask: false,
    addInvoice: false,
    addEvent: false
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setBoardView: (state, action: PayloadAction<BoardViewType>) => {
      state.boardView = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setActiveFilters: (
      state,
      action: PayloadAction<Partial<UIState['activeFilters']>>
    ) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    setNotificationsRead: (state) => {
      state.notificationsUnread = 0;
    },
    incrementUnreadNotifications: (state, action: PayloadAction<number>) => {
      state.notificationsUnread += action.payload;
    },
    toggleModal: (
      state,
      action: PayloadAction<{modal: keyof UIState['modals']; value?: boolean}>
    ) => {
      const { modal, value } = action.payload;
      state.modals[modal] = value !== undefined ? value : !state.modals[modal];
    }
  },
});

export const {
  toggleSidebar,
  setBoardView,
  setTheme,
  setActiveFilters,
  clearFilters,
  setNotificationsRead,
  incrementUnreadNotifications,
  toggleModal
} = uiSlice.actions;

export default uiSlice.reducer;
