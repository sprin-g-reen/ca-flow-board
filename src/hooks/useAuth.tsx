
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authAPI } from '@/services/api';
import { getValidatedToken, setValidatedToken, clearToken } from '@/lib/auth';
import { setUser, setLoading, logout } from '@/store/slices/authSlice';
import { RootState } from '@/store';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: 'owner' | 'superadmin' | 'admin' | 'employee' | 'client';
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

interface AuthResponse {
  success: boolean;
  data?: {
    user: UserProfile;
    token: string;
  };
  message?: string;
}

interface UserResponse {
  success: boolean;
  data?: {
    user: UserProfile;
  };
  message?: string;
}

export function useAuth() {
  const dispatch = useDispatch();
  const { user, loading, isAuthenticated, role } = useSelector((state: RootState) => state.auth);

  const checkAuthStatus = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const token = getValidatedToken();
      
      if (!token) {
        dispatch(setUser(null));
        return;
      }

      const response = await authAPI.getCurrentUser() as UserResponse;
      
      // CRITICAL: Re-verify token existence AFTER the async call to prevent race conditions 
      // during logout. If token was cleared while this request was pending, abort.
      if (!getValidatedToken()) {
        console.log('🛑 Token cleared during validation, aborting auth sync');
        dispatch(setUser(null));
        return;
      }

      if (response.success && response.data?.user) {
        const userData = response.data.user;
        dispatch(setUser({
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName || undefined,
          role: userData.role,
          phone: userData.phone,
          avatar: userData.avatar,
          isActive: userData.isActive,
          firmId: userData.firmId,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin
        }));
      } else {
        clearToken();
        dispatch(logout());
      }
    } catch (error: unknown) {
      console.error('Auth check error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (errorMessage.includes('Unable to connect to server')) {
        // Don't log out if server is just temporarily down
        return;
      }
      
      clearToken();
      dispatch(logout());
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ username: email, password }) as AuthResponse;
      
      if (response.success && response.data?.token) {
        if (setValidatedToken(response.data.token)) {
          const userData = response.data.user;
          dispatch(setUser({
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName || undefined,
            role: userData.role,
            phone: userData.phone,
            avatar: userData.avatar,
            isActive: userData.isActive,
            firmId: userData.firmId,
            createdAt: userData.createdAt,
            lastLogin: userData.lastLogin
          }));
          return { success: true, data: response.data };
        } else {
          return { success: false, error: 'Invalid token received from server' };
        }
      } else {
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    firmName?: string;
    phone?: string;
  }) => {
    try {
      const apiUserData = {
        ...userData,
        name: userData.fullName,
      };
      
      const response = await authAPI.register(apiUserData) as AuthResponse;
      
      if (response.success && response.data?.token) {
        if (setValidatedToken(response.data.token)) {
          const u = response.data.user;
          dispatch(setUser({
            id: u.id,
            email: u.email,
            fullName: u.fullName || undefined,
            role: u.role,
            phone: u.phone,
            avatar: u.avatar,
            isActive: u.isActive,
            firmId: u.firmId,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin
          }));
          return { success: true, data: response.data };
        } else {
          return { success: false, error: 'Invalid token received from server' };
        }
      } else {
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const signOut = useCallback(async () => {
    try {
      console.log('👋 Signing out...');
      clearToken();
      dispatch(logout());
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  const updateProfile = (updatedUser: UserProfile) => {
    dispatch(setUser({
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName || undefined,
      role: updatedUser.role,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      isActive: updatedUser.isActive,
      firmId: updatedUser.firmId,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin
    }));
  };

  return {
    user,
    profile: user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
    role,
    updateProfile,
    checkAuthStatus,
  };
}
