
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'owner' | 'superadmin' | 'admin' | 'employee' | 'client';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  firmId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  loading: boolean;
  name?: string; // Add name property for compatibility
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  role: null,
  loading: true,
  name: undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.role = action.payload?.role || null;
      state.name = action.payload?.fullName || action.payload?.email || undefined;
      state.loading = false;
    },
    setCredentials: (state, action: PayloadAction<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      token: string;
    }>) => {
      const { id, name, email, role } = action.payload;
      state.user = { 
        id, 
        email, 
        fullName: name, 
        role,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      state.isAuthenticated = true;
      state.role = role;
      state.name = name;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
      state.name = undefined;
      state.loading = false;
    },
  },
});

export const { setUser, setCredentials, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
