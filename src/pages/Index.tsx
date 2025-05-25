
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Navigate } from 'react-router-dom';
import { UserRole } from '@/store/slices/authSlice';

const Index = () => {
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const redirectBasedOnRole = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return '/owner/dashboard';
      case 'superadmin':
        return '/admin/dashboard';
      case 'employee':
        return '/employee/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/login';
    }
  };

  return <Navigate to={redirectBasedOnRole(role!)} replace />;
};

export default Index;
