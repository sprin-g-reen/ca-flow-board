import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { FadeIn } from "@/components/ui/animations";
import { toast } from '@/components/ui/enhanced-toast';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { EmployeeSettingsModal } from '@/components/employee/EmployeeSettingsModal';
import { useSystemVitals } from '@/hooks/useSystemVitals';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js';
import { useSettings } from '@/hooks/useSettings';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/store/slices/authSlice';
import { clearToken } from '@/lib/auth';
import { toggleSidebar, toggleChatSidebar } from '@/store/slices/uiSlice';
import { RootState } from '@/store';
import { 
  ChevronDown, 
  Menu, 
  Sparkles, 
  Settings, 
  User, 
  LogOut,
  Shield,
  Activity,
  Clock,
  Cpu,
  HardDrive
} from "lucide-react";

interface AppHeaderProps {
  onAIChatToggle?: () => void;
}

const AppHeader = ({ onAIChatToggle }: AppHeaderProps = {}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { name, role, user } = useSelector((state: RootState) => state.auth as any);
  const { vitals, isLoading: vitalsLoading } = useSystemVitals();
  const { settings: settingsObj, getSetting } = useSettings({ category: 'company' });

  // Derive brand name and logo from settings with sensible fallbacks
  // When using category: 'company', settingsObj IS the company settings directly, not nested
  // Check both 'name' (backend field) and 'companyName' (legacy) for backwards compatibility
  const brandName = settingsObj?.name || settingsObj?.companyName || 'CA Flow Board';
  const branding = (settingsObj?.branding) as any || {};
  const logoUrl = branding?.logoFile || settingsObj?.invoiceAccounts?.account_1?.branding?.logoFile || '';
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showEmployeeSettings, setShowEmployeeSettings] = useState(false);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [applicationUptime, setApplicationUptime] = useState<number>(0);
  const [appUptimeHistory, setAppUptimeHistory] = useState<number[]>([]);
  // Login duration (for employees) - computed from user.lastLogin (fallback to createdAt)
  const [loginSeconds, setLoginSeconds] = useState<number>(0);

  // Track application start time
  useEffect(() => {
    const APP_START_KEY = 'caflow_app_start_time';
    const existingStartTime = localStorage.getItem(APP_START_KEY);
    
    if (!existingStartTime) {
      // First time the app is loaded, record the start time
      localStorage.setItem(APP_START_KEY, Date.now().toString());
    }

    // Update application uptime every minute
    const updateUptime = () => {
      const startTime = parseInt(localStorage.getItem(APP_START_KEY) || Date.now().toString());
      const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
      setApplicationUptime(uptimeSeconds);
      
      // Update history for graph (convert seconds to hours)
      const uptimeHours = uptimeSeconds / 3600;
      setAppUptimeHistory(prev => {
        const updated = [...prev, uptimeHours];
        return updated.slice(-20); // Keep last 20 data points
      });
    };

    updateUptime();
    const interval = setInterval(updateUptime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Update login duration every second for employees
  useEffect(() => {
    if (role !== 'employee' || !user) return;

    const last = user.lastLogin || user.createdAt || null;
    const start = last ? new Date(last).getTime() : Date.now();
    // initial value
    setLoginSeconds(Math.floor((Date.now() - start) / 1000));

    const t = setInterval(() => {
      setLoginSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(t);
  }, [role, user]);

  const handleLogout = () => {
    toast.loading('Signing out...');
    clearToken();
    dispatch(logout());
    setTimeout(() => {
      toast.success('Successfully signed out');
      navigate('/login');
    }, 1000);
  };

  const handleMessages = () => {
    if (onAIChatToggle) {
      onAIChatToggle(); // Open AI chatbox
    } else {
      dispatch(toggleChatSidebar()); // Fallback to chat sidebar
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      case 'client': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // register chart components
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, TimeScale);

  // maintain a small rolling history of CPU load for the chart
  useEffect(() => {
    if (!vitals) return;
    const raw = vitals.cpu?.load;
    let val = NaN;
    if (typeof raw === 'string') {
      val = parseFloat(raw.replace('%', '').trim());
    } else if (typeof raw === 'number') {
      val = raw;
    }
    if (Number.isFinite(val)) {
      setCpuHistory(prev => {
        const next = [...prev, val].slice(-30);
        return next;
      });
    }
  }, [vitals]);

  const inferStatus = () => {
    if (!vitals) return { level: 'unknown', message: 'Vitals unavailable' };
    const cpuRaw = vitals.cpu?.load;
    const memRaw = vitals.memory?.usage;
    const cpu = typeof cpuRaw === 'string' ? parseFloat(cpuRaw.replace('%','')) : Number(cpuRaw || NaN);
    const mem = typeof memRaw === 'string' ? parseFloat(memRaw.replace('%','')) : Number(memRaw || NaN);

    if ((cpu && cpu > 85) || (mem && mem > 90)) {
      return { level: 'critical', message: 'High load — investigate background jobs or memory leaks' };
    }
    if ((cpu && cpu > 70) || (mem && mem > 75)) {
      return { level: 'warning', message: 'Moderate load — monitor recent spikes' };
    }
    return { level: 'healthy', message: 'System performing normally' };
  };

  const status = inferStatus();

  // Ensure percent string always ends with % for CSS width
  const toPercentString = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '0%';
    const s = String(val).trim();
    return s.endsWith('%') ? s : `${s}%`;
  };

  return (
    <FadeIn>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
        {/* align header content with main layout (max-w-7xl) so it follows screen width on large displays */}
        <div className="max-w-7xl mx-auto w-full flex h-16 items-center justify-between py-4 px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => dispatch(toggleSidebar())}
              className="hover:bg-ca-blue/10 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={`${brandName} logo`} className="h-8 w-8 rounded-md object-contain" />
                ) : (
                  <div className="p-2 bg-gradient-to-br from-ca-blue to-blue-600 rounded-xl shadow-md">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                )}

                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-ca-blue to-blue-600 bg-clip-text text-transparent">
                    {brandName}
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">Intelligent Workflow</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Center Section - Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <GlobalSearch />
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* System Vitals - only visible to non-employee roles */}
            {role !== 'employee' ? (
              <div
                className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setShowVitalsModal(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setShowVitalsModal(true); }}
                title={`System: ${vitals?.uptime ? Math.floor(vitals.uptime / 3600) + 'h' : 'N/A'} | App: ${applicationUptime ? Math.floor(applicationUptime / 3600) + 'h' : 'N/A'}`}
              >
                {vitalsLoading ? (
                  <>
                    <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                    <span className="text-xs font-medium text-blue-700">Loading...</span>
                  </>
                ) : vitals ? (
                  <>
                    <div className="flex items-center space-x-1">
                      <Cpu className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">{vitals.cpu?.load || 'N/A'}</span>
                    </div>
                    <div className="w-px h-4 bg-blue-300" />
                    <div className="flex items-center space-x-1">
                      <HardDrive className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">{vitals.memory?.usage || 'N/A'}</span>
                    </div>
                    <div className="w-px h-4 bg-blue-300" />
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">
                        {vitals.uptime ? `${Math.floor(vitals.uptime / 3600)}h` : 'N/A'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Offline</span>
                  </>
                )}
              </div>
            ) : (
              // For employees show a lightweight "Logged in" duration instead of system vitals
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200" title={`Logged in since: ${user?.lastLogin || user?.createdAt || 'N/A'}`}>
                <Clock className="h-4 w-4 text-gray-600" />
                <div className="text-xs font-medium text-gray-700">
                  Logged in: {loginSeconds ? `${Math.floor(loginSeconds/3600)}h ${Math.floor((loginSeconds%3600)/60)}m` : '0m'}
                </div>
              </div>
            )}
            
            {/* Notifications */}
            <NotificationCenter />
            
            {/* AI Assistant Button with Magical Sparkle Effect */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleMessages}
              className="relative hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all group"
              title="AI Assistant"
            >
              <Sparkles className="h-5 w-5 text-purple-600 group-hover:text-blue-600 transition-colors" />
              {/* Magical glow effect */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-purple-500 to-blue-500"></span>
              </span>
              {/* Additional sparkles */}
              <span className="absolute top-0 left-0 w-1 h-1 bg-purple-400 rounded-full animate-sparkle-1 opacity-0"></span>
              <span className="absolute bottom-1 right-0 w-1 h-1 bg-blue-400 rounded-full animate-sparkle-2 opacity-0"></span>
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 pl-2 pr-3 py-2 hover:bg-gray-100 transition-colors rounded-lg">
                  <Avatar className="h-9 w-9 ring-2 ring-ca-blue/20">
                    <AvatarImage src={user?.avatar || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-ca-blue to-blue-600 text-white font-semibold">
                      {name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{name || 'User'}</span>
                    <Badge className={`text-xs ${getRoleBadgeColor(role || '')}`}>
                      {role?.charAt(0).toUpperCase() + role?.slice(1) || 'User'}
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-ca-blue to-blue-600 text-white font-semibold text-lg">
                        {name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold">{name}</p>
                      <Badge className={`text-xs w-fit ${getRoleBadgeColor(role || '')}`}>
                        {role?.charAt(0).toUpperCase() + role?.slice(1) || 'User'}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => {
                    if (role === 'owner') {
                      navigate('/owner/settings');
                    } else {
                      // For employees and other roles, show profile/settings
                      if (role === 'employee') {
                        navigate('/employee/profile');
                      }
                    }
                  }}
                  className="p-3 focus:bg-gray-50 rounded-md"
                >
                  <User className="mr-3 h-4 w-4" />
                  <span>Profile & Account</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => {
                    if (role === 'owner') {
                      navigate('/owner/settings');
                    } else {
                      // For employees and other roles, show settings modal
                      setShowEmployeeSettings(true);
                    }
                  }}
                  className="p-3 focus:bg-gray-50 rounded-md"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Settings & Preferences</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="p-3 focus:bg-red-50 rounded-md text-red-600 focus:text-red-700"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Vitals Modal */}
          <Dialog open={showVitalsModal} onOpenChange={setShowVitalsModal}>
            <DialogContent className="max-h-[90vh] flex flex-col max-w-4xl p-0">
              <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
                <DialogTitle className="text-xl font-semibold">System Vitals — Real-time</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.level === 'critical' ? 'bg-red-100 text-red-800' : status.level === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {status.level === 'critical' ? 'Critical' : status.level === 'warning' ? 'Warning' : 'Healthy'}
                    </span>
                    <div className="text-sm text-gray-700">{status.message}</div>
                  </div>
                </div>

                {vitalsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading vitals...</p>
                ) : vitals ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* CPU Graph */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">CPU</h4>
                          <span className="text-xs text-muted-foreground">Load: {vitals.cpu?.load || 'N/A'}</span>
                        </div>
                        <div className="h-32">
                          <Line
                            data={{
                              labels: cpuHistory.map((_, i) => i + 1),
                              datasets: [
                                {
                                  label: 'CPU %',
                                  data: cpuHistory,
                                  fill: true,
                                  backgroundColor: 'rgba(59,130,246,0.12)',
                                  borderColor: 'rgba(59,130,246,0.9)',
                                  tension: 0.3,
                                  pointRadius: 0
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                x: { display: false },
                                y: { display: true, suggestedMin: 0, suggestedMax: 100 }
                              },
                              plugins: { legend: { display: false }, tooltip: { enabled: true } }
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" />User: {vitals.cpu?.user ?? 'N/A'}</div>
                          <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />System: {vitals.cpu?.system ?? 'N/A'}</div>
                          <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-gray-400" />Idle: {vitals.cpu?.idle ?? 'N/A'}</div>
                        </div>
                      </div>

                      {/* Application Uptime Graph */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">Application Uptime</h4>
                          <span className="text-xs text-muted-foreground">
                            {applicationUptime ? `${Math.floor(applicationUptime/3600)}h ${Math.floor((applicationUptime%3600)/60)}m` : 'N/A'}
                          </span>
                        </div>
                        <div className="h-32">
                          <Line
                            data={{
                              labels: appUptimeHistory.map((_, i) => i + 1),
                              datasets: [
                                {
                                  label: 'Uptime (hours)',
                                  data: appUptimeHistory,
                                  fill: true,
                                  backgroundColor: 'rgba(16,185,129,0.12)',
                                  borderColor: 'rgba(16,185,129,0.9)',
                                  tension: 0.3,
                                  pointRadius: 0
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                x: { display: false },
                                y: { display: true, suggestedMin: 0 }
                              },
                              plugins: { 
                                legend: { display: false }, 
                                tooltip: { 
                                  enabled: true,
                                  callbacks: {
                                    label: function(context) {
                                      const hours = Math.floor(context.parsed.y);
                                      const minutes = Math.floor((context.parsed.y % 1) * 60);
                                      return `Uptime: ${hours}h ${minutes}m`;
                                    }
                                  }
                                } 
                              }
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          Application has been running in this session
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Memory */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">Memory</h4>
                          <span className="text-xs text-muted-foreground">Usage: {vitals.memory?.usage || 'N/A'}</span>
                        </div>
                        <div className="rounded border p-3 bg-white">
                          <div className="text-xs text-muted-foreground">Used: <span className="font-medium text-gray-900">{vitals.memory?.used || 'N/A'}</span> / <span className="font-medium text-gray-900">{vitals.memory?.total || 'N/A'}</span></div>
                          <div className="mt-2 h-2 bg-gray-100 rounded overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: toPercentString(vitals.memory?.usage as any) }} />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold">System Uptime</h4>
                          <p className="text-xs text-muted-foreground">{vitals.uptime ? `${Math.floor(vitals.uptime/3600)}h ${Math.floor((vitals.uptime%3600)/60)}m` : 'N/A'}</p>
                          <p className="text-xs mt-1 text-gray-500">Server has been running since last reboot</p>
                        </div>
                      </div>

                      {/* System Stats */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded border p-3 bg-white">
                            <h4 className="text-sm font-semibold">Threads</h4>
                            <div className="text-sm font-medium text-gray-900">{(vitals as any)?.threads ?? (vitals as any)?.threadCount ?? 'N/A'}</div>
                            <p className="text-xs text-muted-foreground mt-1">Active thread count on the host</p>
                          </div>

                          <div className="rounded border p-3 bg-white">
                            <h4 className="text-sm font-semibold">Processes</h4>
                            <div className="text-sm font-medium text-gray-900">{(vitals as any)?.processes ?? (vitals as any)?.processCount ?? 'N/A'}</div>
                            <p className="text-xs text-muted-foreground mt-1">Number of running processes</p>
                          </div>
                        </div>

                        <div className="rounded border p-3 bg-white">
                          <h4 className="text-sm font-semibold mb-2">Load Average</h4>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>1m: <span className="font-medium text-gray-900">{vitals.loadAverages?.oneMin ?? 'N/A'}</span></div>
                            <div>5m: <span className="font-medium text-gray-900">{vitals.loadAverages?.fiveMin ?? 'N/A'}</span></div>
                            <div>15m: <span className="font-medium text-gray-900">{vitals.loadAverages?.fifteenMin ?? 'N/A'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">Vitals unavailable (offline)</p>
                )}
              </div>
              <DialogFooter>
                <div className="flex justify-end">
                  <Button onClick={() => setShowVitalsModal(false)}>Close</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Employee Settings Modal */}
          <EmployeeSettingsModal 
            isOpen={showEmployeeSettings} 
            onClose={() => setShowEmployeeSettings(false)} 
          />
        </div>
      </header>
    </FadeIn>
  );
};

export default AppHeader;
