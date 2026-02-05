import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { 
  Calendar, 
  ClipboardCheck, 
  FileText, 
  Home, 
  LayoutDashboard, 
  MessageSquare, 
  PieChart, 
  Settings, 
  Trash2,
  Users,
  User,
  ChevronDown,
  ChevronRight,
  FileBarChart
} from 'lucide-react';
import { RootState } from '@/store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/store/slices/authSlice';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

interface SidebarMenuItemProps {
  icon: React.ReactNode;
  label: string;
  subItems: Array<{ to: string; label: string }>;
}

const SidebarMenuItem = ({ icon, label, subItems }: SidebarMenuItemProps) => {
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  const [isOpen, setIsOpen] = useState(false);
  
  if (sidebarCollapsed) {
    // In collapsed mode, show icon with tooltip
    return (
      <div className="relative group">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
          {icon}
        </div>
        {/* Tooltip on hover */}
        <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-50 min-w-max">
          <div className="bg-popover text-popover-foreground rounded-md shadow-md border p-2">
            <div className="font-medium mb-1">{label}</div>
            {subItems.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.to}
                className="block text-xs py-1 hover:text-blue-600 transition-colors"
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-accent/80 hover:shadow-sm group relative",
          "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center justify-center w-5 h-5 transition-transform group-hover:scale-110">
          {icon}
        </div>
        <span className="text-sm font-medium transition-all flex-1 text-left">{label}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 transition-transform" />
        )}
      </button>
      {isOpen && (
        <div className="ml-8 mt-1 space-y-1">
          {subItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "block px-3 py-2 text-sm rounded-lg transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const SidebarLink = ({ to, icon, label, end = false }: SidebarLinkProps) => {
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  
  return (
    <NavLink 
      to={to}
      end={end}
      className={({ isActive }) => cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-accent/80 hover:shadow-sm group relative",
        isActive 
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25" 
          : "text-muted-foreground hover:text-foreground",
        sidebarCollapsed && "justify-center px-2"
      )}
    >
      <div className={cn(
        "flex items-center justify-center transition-transform group-hover:scale-110",
        sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"
      )}>
        {icon}
      </div>
      {!sidebarCollapsed && (
        <span className="text-sm font-medium transition-all">{label}</span>
      )}
      
      {/* Active indicator */}
      {!sidebarCollapsed && (
        <div className="absolute right-2 w-1 h-6 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </NavLink>
  );
};

const ownerLinks = [
  { to: '/owner/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', end: true },
  { to: '/owner/clients', icon: <Users className="h-5 w-5" />, label: 'Clients' },
  { to: '/owner/employees', icon: <Users className="h-5 w-5" />, label: 'Employees' },
  { to: '/owner/tasks', icon: <ClipboardCheck className="h-5 w-5" />, label: 'Tasks' },
  { to: '/owner/templates', icon: <FileText className="h-5 w-5" />, label: 'Templates' },
  { to: '/owner/invoices', icon: <FileText className="h-5 w-5" />, label: 'Invoices' },
  { to: '/owner/views', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Views' },
  { to: '/owner/analytics', icon: <PieChart className="h-5 w-5" />, label: 'Analytics' },
  { to: '/owner/recycle-bin', icon: <Trash2 className="h-5 w-5" />, label: 'Recycle Bin' },
  { to: '/owner/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
];

const ownerGSTReportsMenu = {
  icon: <FileBarChart className="h-5 w-5" />,
  label: 'GST Reports',
  subItems: [
    { to: '/owner/reports/gst/monthly', label: 'Monthly Report' },
    { to: '/owner/reports/gst/quarterly', label: 'Quarterly Report' },
    { to: '/owner/reports/gst/annual', label: 'Annual Report' },
  ],
};

const adminLinks = [
  { to: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', end: true },
  { to: '/admin/employees', icon: <Users className="h-5 w-5" />, label: 'Employees' },
  { to: '/admin/tasks', icon: <ClipboardCheck className="h-5 w-5" />, label: 'Tasks' },
  { to: '/admin/templates', icon: <FileText className="h-5 w-5" />, label: 'Templates' },
  { to: '/admin/invoices', icon: <FileText className="h-5 w-5" />, label: 'Invoices' },
  { to: '/admin/analytics', icon: <PieChart className="h-5 w-5" />, label: 'Analytics' },
];

const employeeLinks = [
  { to: '/employee/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', end: true },
  { to: '/employee/tasks', icon: <ClipboardCheck className="h-5 w-5" />, label: 'My Tasks' },
  { to: '/employee/clients', icon: <Users className="h-5 w-5" />, label: 'Clients' },
  { to: '/employee/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Messages' },
  { to: '/employee/profile', icon: <User className="h-5 w-5" />, label: 'Profile' },
  { to: '/employee/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
];

const clientLinks = [
  { to: '/client/dashboard', icon: <Home className="h-5 w-5" />, label: 'Dashboard', end: true },
  { to: '/client/tasks', icon: <ClipboardCheck className="h-5 w-5" />, label: 'My Tasks' },
  { to: '/client/invoices', icon: <FileText className="h-5 w-5" />, label: 'Invoices' },
  { to: '/client/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Messages' },
];

interface AppSidebarProps {
  onChatToggle?: () => void;
}

const AppSidebar = ({ onChatToggle }: AppSidebarProps = {}) => {
  const { role } = useSelector((state: RootState) => state.auth);
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);

  const getLinksByRole = (role: UserRole | null) => {
    switch (role) {
      case 'owner':
        return ownerLinks;
      case 'superadmin':
      case 'admin':
        return adminLinks;
      case 'employee':
        return employeeLinks;
      case 'client':
        return clientLinks;
      default:
        return [];
    }
  };

  const links = getLinksByRole(role);

  if (!role) return null;

  return (
    <aside 
      className={cn(
        "fixed left-0 z-30 flex flex-col bg-gradient-to-b from-slate-50/80 via-white to-slate-50/80 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-900/80 border-r border-border/40 shadow-xl backdrop-blur-sm transition-all duration-300",
        "top-16 bottom-0", // Start below the header (64px = 16 * 0.25rem)
        sidebarCollapsed ? "w-[80px]" : "w-64"
      )}
    >
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-5">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center space-y-8 py-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  {link.icon}
                </NavLink>
              ))}
              {/* GST Reports in collapsed mode */}
              {(role === 'owner' || role === 'admin' || role === 'superadmin') && (
                <SidebarMenuItem
                  icon={ownerGSTReportsMenu.icon}
                  label={ownerGSTReportsMenu.label}
                  subItems={ownerGSTReportsMenu.subItems.map(item => ({
                    ...item,
                    to: item.to.replace('/owner/', `/${role === 'owner' ? 'owner' : 'admin'}/`)
                  }))}
                />
              )}
            </div>
          ) : (
            <nav className="space-y-2">
              {links.map((link) => (
                <SidebarLink 
                  key={link.to} 
                  to={link.to} 
                  icon={link.icon} 
                  label={link.label} 
                  end={link.end} 
                />
              ))}
              {/* GST Reports menu (after Views) */}
              {(role === 'owner' || role === 'admin' || role === 'superadmin') && (
                <SidebarMenuItem
                  icon={ownerGSTReportsMenu.icon}
                  label={ownerGSTReportsMenu.label}
                  subItems={ownerGSTReportsMenu.subItems.map(item => ({
                    ...item,
                    to: item.to.replace('/owner/', `/${role === 'owner' ? 'owner' : 'admin'}/`)
                  }))}
                />
              )}
            </nav>
          )}
        </div>
      </ScrollArea>
      
      {/* Chat Toggle Button - Only for Owner/Admin, not for Employees (they use Messages link) */}
      {onChatToggle && role !== 'employee' && role !== 'client' && (
        <div className="p-4 border-t">
          <Button
            variant="outline"
            onClick={onChatToggle}
            className={cn(
              "w-full flex items-center gap-2 transition-all",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            {!sidebarCollapsed && <span className="text-sm">Team Chat</span>}
          </Button>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
