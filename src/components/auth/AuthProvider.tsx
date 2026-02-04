import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    // Perform initial authentication check on mount
    checkAuthStatus();
  }, [checkAuthStatus]);

  return <>{children}</>;
}