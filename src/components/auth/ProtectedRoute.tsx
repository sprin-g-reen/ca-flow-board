
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  console.log('🛡️ ProtectedRoute check:', { 
    isAuthenticated, 
    role, 
    loading, 
    path: location.pathname, 
    allowedRoles 
  });

  if (loading) {
    console.log('⏳ Auth loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ca-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    // Add a small delay to ensure proper state cleanup
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    console.log('🚫 Role not allowed:', role, 'Required:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Access granted');
  return <>{children}</>;
}
