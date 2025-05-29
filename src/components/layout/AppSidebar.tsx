
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { 
  Calendar, 
  ClipboardCheck, 
  FileText, 
  Home, 
  LayoutDashboard, 
  MessageSquare, 
  PieChart, 
  Settings, 
  Users,
  FileTemplate
} from 'lucide-react';
import { RootState } from '@/store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserRole } from '@/store/slices/authSlice';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

const SidebarLink = ({ to, icon, label, end = false }: SidebarLinkProps) => (
  <NavLink 
    to={to}
    end={end}
    className={({ isActive }) => cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
    )}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </NavLink>
);

const ownerLinks = [
  { to: '/owner/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', end: true },
  { to: '/owner/clients', icon: <Users className="h-5 w-5" />, label: 'Clients' },
  { to: '/owner/employees', icon: <Users className="h-5 w-5" />, label: 'Employees' },
  { to: '/owner/tasks', icon: <ClipboardCheck className="h-5 w-5" />, label: 'Tasks' },
  { to: '/owner/templates', icon: <FileTemplate className="h-5 w-5" />, label: 'Templates' },
  { to: '/owner/invoices', icon: <FileText className="h-5 w-5" />, label: 'Invoices' },
  { to: '/owner/calendar', icon: <Calendar className="h-5 w-5" />, label: 'Calendar' },
  { to: '/owner/analytics', icon: <PieChart className="h-5 w-5" />, label: 'Analytics' },
  { to: '/owner/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', end: true },
  { to: '/admin/employees', icon: <Users className="h-5 w-5" />, label: 'Employees' },
  { to: '/admin/tasks', icon: <ClipboardCheck className="h-5 w-5" />, label: 'Tasks' },
  { to: '/admin/templates', icon: <FileTemplate className="h-5 w-5" />, label: 'Templates' },
  { to: '/admin/invoices', icon: <FileText className="h-5 w-5" />, label: 'Invoices' },
  { to: '/admin/analytics', icon: <PieChart className="h-5 w-5" />, label: 'Analytics' },
];

const employeeLinks = [
  { to: '/employee/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', end: true },
  { to: '/employee/tasks', icon: <ClipboardCheck className="h-5 w-5" />, label: 'My Tasks' },
  { to: '/employee/calendar', icon: <Calendar className="h-5 w-5" />, label: 'Calendar' },
  { to: '/employee/clients', icon: <Users className="h-5 w-5" />, label: 'Clients' },
  { to: '/employee/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Messages' },
];

const clientLinks = [
  { to: '/client/dashboard', icon: <Home className="h-5 w-5" />, label: 'Dashboard', end: true },
  { to: '/client/tasks', icon: <ClipboardCheck className="h-5 w-5" />, label: 'My Tasks' },
  { to: '/client/invoices', icon: <FileText className="h-5 w-5" />, label: 'Invoices' },
  { to: '/client/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Messages' },
];

const AppSidebar = () => {
  const { role } = useSelector((state: RootState) => state.auth);
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);

  const getLinksByRole = (role: UserRole | null) => {
    switch (role) {
      case 'owner':
        return ownerLinks;
      case 'superadmin':
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
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-card border-r shadow-sm transition-all",
        sidebarCollapsed ? "w-[80px]" : "w-64"
      )}
    >
      <div className={cn("h-16 flex items-center", 
        sidebarCollapsed ? "justify-center" : "px-4"
      )}>
        {sidebarCollapsed ? (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-ca-blue text-white font-bold">
            CA
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-ca-blue text-white font-bold">
              CA
            </div>
            <span className="text-xl font-bold text-ca-blue">CA Flow</span>
          </div>
        )}
      </div>
      <Separator />
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
            </nav>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default AppSidebar;
