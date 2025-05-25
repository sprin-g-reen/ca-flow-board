
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'owner' | 'superadmin' | 'admin' | 'employee' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  name: string | null;
  role: UserRole | null;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  name: null,
  role: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.name = null;
      state.role = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
