
import { useEffect, useState } from 'react';
import { authAPI } from '@/services/api';
import { getValidatedToken, setValidatedToken, clearToken } from '@/lib/auth';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = getValidatedToken();
      
      console.log('🔐 Checking auth status, token exists:', !!token);
      
      if (!token) {
        console.log('❌ No valid token found, setting unauthenticated');
        setLoading(false);
        return;
      }

      console.log(' Token found, validating with server...');
      const response = await authAPI.getCurrentUser() as UserResponse;
      
      console.log('📡 Auth response:', response?.success ? '✅ Success' : '❌ Failed');
      
      if (response.success && response.data?.user) {
        console.log('✅ User authenticated:', response.data.user.email, 'Role:', response.data.user.role);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        console.log('❌ Auth validation failed, removing token');
        clearToken();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error: unknown) {
      console.error('Auth check error:', error);
      
      // Handle specific error types
      const errorMessage = error instanceof Error ? error.message : 'Authentication check failed';
      
      // If it's a connection error, don't clear auth state immediately
      if (errorMessage.includes('Unable to connect to server')) {
        console.warn('Server connection failed during auth check, retrying...');
        // Retry after a short delay
        setTimeout(() => {
          checkAuthStatus();
        }, 2000);
        return;
      }
      
      // For other errors, clear auth state
      clearToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password }) as AuthResponse;
      
      if (response.success && response.data?.token) {
        if (setValidatedToken(response.data.token)) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          return { success: true, data: response.data };
        } else {
          return { success: false, error: 'Invalid token received from server' };
        }
      } else {
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error: unknown) {
      console.error('Sign in error:', error);
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
      // Map fullName to name for API compatibility
      const apiUserData = {
        ...userData,
        name: userData.fullName,
      };
      
      const response = await authAPI.register(apiUserData) as AuthResponse;
      
      if (response.success && response.data?.token) {
        if (setValidatedToken(response.data.token)) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          return { success: true, data: response.data };
        } else {
          return { success: false, error: 'Invalid token received from server' };
        }
      } else {
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error: unknown) {
      console.error('Sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      clearToken();
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error: unknown) {
      console.error('Sign out error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  return {
    user,
    profile: user, // For backward compatibility
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
    role: user?.role || null,
    updateProfile,
    checkAuthStatus,
  };
}
