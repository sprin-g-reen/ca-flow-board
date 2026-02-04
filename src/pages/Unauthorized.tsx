import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleBackToLogin = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-2xl shadow-xl">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
        
        <p className="text-gray-600 text-lg">
          You don't have the required permissions to access this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <div className="pt-4">
          <Button 
            onClick={handleBackToLogin}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out & Return to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
