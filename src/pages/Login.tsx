
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, role, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && role) {
      const from = location.state?.from?.pathname || getDefaultRoute(role);
      navigate(from);
    }
  }, [isAuthenticated, role, navigate, location]);

  const getDefaultRoute = (role: string) => {
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
        return '/';
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ca-blue/5 to-ca-blue/10">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-ca-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ca-blue/5 to-ca-blue/10 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 shadow-2xl bg-white rounded-2xl overflow-hidden">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex bg-gradient-to-br from-ca-blue to-ca-blue-dark p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-8">
              <Shield className="h-12 w-12 mr-4" />
              <div>
                <h1 className="text-4xl font-bold">CA Flow</h1>
                <p className="text-ca-blue-light">Professional Task Management</p>
              </div>
            </div>
            <p className="text-xl mb-8 leading-relaxed">
              Streamlined workflow management platform designed specifically for Chartered Accountancy firms
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-green-400" />
                <span className="text-lg">Role-based secure access control</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-green-400" />
                <span className="text-lg">Advanced task management & templates</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-green-400" />
                <span className="text-lg">Integrated invoicing & payment tracking</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-green-400" />
                <span className="text-lg">Real-time client communication</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-green-400" />
                <span className="text-lg">Comprehensive performance analytics</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 text-sm text-ca-blue-light">
            <p>© 2024 CA Flow. All rights reserved.</p>
            <p className="mt-1">Empowering CA firms with intelligent workflow solutions</p>
          </div>
        </div>
        
        {/* Right Panel - Login Form */}
        <div className="flex flex-col items-center justify-center px-8 py-12 lg:px-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="lg:hidden flex items-center justify-center mb-6">
                <Shield className="h-10 w-10 text-ca-blue mr-3" />
                <h1 className="text-3xl font-bold text-ca-blue">CA Flow</h1>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-gray-600">Sign in to access your workspace</p>
            </div>

            {/* Login Form */}
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-12 text-base"
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-ca-blue hover:bg-ca-blue-dark text-white text-base font-medium transition-all duration-200 transform hover:scale-[1.02]" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Demo Credentials */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-ca-blue" />
                Demo Access
              </h3>
              <div className="space-y-3">
                <div className="bg-white rounded-md p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Owner Login</p>
                  <p className="text-sm text-gray-800 font-mono">rohith@springreen.in</p>
                  <p className="text-sm text-gray-800 font-mono">springreen.in</p>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  <p>🔒 Only Owner/Super Admin can create new accounts</p>
                  <p>Contact your administrator to get access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
