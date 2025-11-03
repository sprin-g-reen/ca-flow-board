
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { setUser, setLoading } from '@/store/slices/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('🔄 AuthProvider syncing:', { hasUser: !!user, loading });
    
    dispatch(setLoading(loading));
    
    if (user) {
      dispatch(setUser({
        id: user.id,
        email: user.email,
        fullName: user.fullName || undefined,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        firmId: user.firmId,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }));
    } else if (!loading) {
      // Only clear user data when loading is complete and no user found
      dispatch(setUser(null));
    }
  }, [user, loading, dispatch]);

  return <>{children}</>;
}
