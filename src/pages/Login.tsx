
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';
import { setUser } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FadeIn, SlideIn, ScaleIn } from '@/components/ui/animations';
import { toast } from '@/components/ui/enhanced-toast';
import { 
  Loader2, 
  Shield, 
  CheckCircle, 
  Info, 
  Eye, 
  EyeOff, 
  Building2,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Lock,
  AlertCircle
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { signIn, signUp } = useAuth();
  
  // Use Redux state for navigation decisions to ensure consistency with ProtectedRoute
  const { isAuthenticated, role, loading } = useSelector((state: RootState) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<{email?: string; password?: string}>({});

  useEffect(() => {
    console.log('🚦 Login useEffect triggered:', { isAuthenticated, role, loading });
    
    // Only redirect when we're sure about authentication state and not loading
    if (!loading && isAuthenticated && role) {
      const from = location.state?.from?.pathname || getDefaultRoute(role);
      console.log('🎯 Redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, role, loading, navigate, location]);

  const getDefaultRoute = (role: string) => {
    switch (role) {
      case 'owner':
        return '/owner/dashboard';
      case 'superadmin':
        return '/admin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'employee':
        return '/employee/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/';
    }
  };

  const validateForm = () => {
    const errors: {email?: string; password?: string} = {};
    
    if (!email.trim()) {
      errors.email = 'Username or email is required';
    } else if (email.trim().length < 3) {
      errors.email = 'Username or email must be at least 3 characters';
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setFormErrors({});

    const loadingToast = toast.loading('Signing you in...');

    try {
      const result = await signIn(email, password);
      
      toast.dismiss(loadingToast);
      
      if (!result.success) {
        if (result.error?.includes('Invalid credentials')) {
          const errorMsg = 'Invalid username/email or password. Please check your credentials and try again.';
          toast.error(errorMsg);
          setError(errorMsg);
        } else {
          toast.error(result.error || 'Login failed');
          setError(result.error || 'Login failed');
        }
      } else {
        toast.success('Welcome back!');
        
        // Immediately update Redux store to trigger navigation
        if (result.data?.user) {
          dispatch(setUser({
            id: result.data.user.id,
            email: result.data.user.email,
            fullName: result.data.user.fullName || undefined,
            role: result.data.user.role,
            phone: result.data.user.phone,
            avatar: result.data.user.avatar,
            isActive: result.data.user.isActive,
            firmId: result.data.user.firmId,
            createdAt: result.data.user.createdAt,
            lastLogin: result.data.user.lastLogin
          }));
          
          // Navigate immediately after successful login
          const from = location.state?.from?.pathname || getDefaultRoute(result.data.user.role);
          console.log('🎯 Immediately redirecting to:', from);
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('An unexpected error occurred. Please try again.');
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <FadeIn>
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" className="mx-auto text-ca-blue" />
            <p className="text-sm text-gray-600 animate-pulse">Loading your workspace...</p>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 shadow-2xl bg-white rounded-3xl overflow-hidden">
        {/* Left Panel - Enhanced Branding */}
        <SlideIn direction="left" className="hidden lg:flex bg-gradient-to-br from-ca-blue via-blue-600 to-indigo-700 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-full"></div>
            <div className="absolute top-40 right-16 w-24 h-24 border border-white/20 rounded-full"></div>
            <div className="absolute bottom-32 left-16 w-40 h-40 border border-white/20 rounded-full"></div>
          </div>
          
          <FadeIn delay="200ms" className="relative z-10">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm mr-4">
                <Shield className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  CA Flow Board
                </h1>
                <p className="text-blue-100 font-medium">Intelligent CA Firm Management</p>
              </div>
            </div>
            
            <p className="text-xl mb-8 leading-relaxed text-blue-50">
              Transform your CA practice with our comprehensive workflow management platform designed to streamline operations and enhance client service.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Building2, text: "Advanced Client Management & Onboarding" },
                { icon: Users, text: "Smart Task Assignment & Templates" },
                { icon: CreditCard, text: "Automated Invoicing & Payment Processing" },
                { icon: FileText, text: "Secure Document Management" },
                { icon: BarChart3, text: "Real-time Analytics & Performance Insights" }
              ].map((feature, index) => (
                <FadeIn key={index} delay={`${400 + index * 100}ms`}>
                  <div className="flex items-center group">
                    <div className="p-2 bg-green-400/20 rounded-lg mr-3 group-hover:bg-green-400/30 transition-colors">
                      <feature.icon className="h-5 w-5 text-green-300" />
                    </div>
                    <span className="text-lg text-blue-50">{feature.text}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
          
          <FadeIn delay="800ms" className="relative z-10 text-sm text-blue-100">
            <p>© 2025 CA Flow Board. All rights reserved.</p>
            <p className="mt-1">Empowering CA firms with intelligent solutions</p>
          </FadeIn>
        </SlideIn>
        {/* Right Panel - Enhanced Login Form */}
        <SlideIn direction="right" className="flex flex-col items-center justify-center px-8 py-12 lg:px-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <FadeIn delay="300ms" className="text-center">
              <div className="lg:hidden flex items-center justify-center mb-6">
                <div className="p-2 bg-ca-blue/10 rounded-xl mr-3">
                  <Shield className="h-8 w-8 text-ca-blue" />
                </div>
                <h1 className="text-3xl font-bold text-ca-blue">CA Flow Board</h1>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600 text-lg">Sign in to access your workspace</p>
            </FadeIn>

            {/* Login Form */}
            <ScaleIn delay="400ms">
              <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-gray-50/50 p-6">
                <CardContent className="p-0">
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Username or Email
                      </Label>
                      <Input
                        id="email"
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) setFormErrors(prev => ({...prev, email: undefined}));
                        }}
                        placeholder="Enter your username or email"
                        className={`h-12 text-base transition-all duration-200 ${formErrors.email ? 'border-red-300 focus:border-red-500' : 'focus:border-ca-blue'}`}
                        required
                        autoFocus
                      />
                      {formErrors.email && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (formErrors.password) setFormErrors(prev => ({...prev, password: undefined}));
                          }}
                          placeholder="Enter your password"
                          className={`h-12 text-base pr-12 transition-all duration-200 ${formErrors.password ? 'border-red-300 focus:border-red-500' : 'focus:border-ca-blue'}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {formErrors.password && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.password}
                        </p>
                      )}
                    </div>

                    {error && (
                      <FadeIn>
                        <Alert variant={error.includes('successfully') ? 'default' : 'destructive'} 
                               className={error.includes('successfully') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                          <AlertDescription className={error.includes('successfully') ? 'text-green-800' : 'text-red-800'}>
                            {error}
                          </AlertDescription>
                        </Alert>
                      </FadeIn>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-ca-blue to-blue-600 hover:from-ca-blue-dark hover:to-blue-700 text-white text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </ScaleIn>

          </div>
        </SlideIn>
      </div>
    </div>
  );
};

export default Login;
