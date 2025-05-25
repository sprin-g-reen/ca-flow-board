
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { setUser, setLoading } from '@/store/slices/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    dispatch(setLoading(loading));
    
    if (profile && user) {
      dispatch(setUser({
        id: user.id,
        email: user.email!,
        full_name: profile.full_name || undefined,
        role: profile.role,
      }));
    } else if (!loading) {
      dispatch(setUser(null));
    }
  }, [user, profile, loading, dispatch]);

  return <>{children}</>;
}
