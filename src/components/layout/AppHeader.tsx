
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, MessageSquare, Search, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useToast } from '@/hooks/use-toast';

const AppHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { name, role } = useSelector((state: RootState) => state.auth);
  const { notificationsUnread } = useSelector((state: RootState) => state.ui);
  const { toast } = useToast();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "No new notifications at this time.",
    });
  };

  const handleMessages = () => {
    toast({
      title: "Messages",
      description: "Coming soon! WhatsApp and SMS integration will be available shortly.",
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => dispatch(toggleSidebar())}>
            <Menu className="h-6 w-6" />
          </Button>
          <h2 className="text-2xl font-bold text-ca-blue ml-4">CA Flow</h2>
        </div>
        
        <div className="hidden md:block lg:w-[400px]">
          <GlobalSearch />
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative" onClick={handleNotifications}>
            <Bell className="h-5 w-5" />
            {notificationsUnread > 0 && (
              <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ca-red text-[10px] text-white">
                {notificationsUnread}
              </span>
            )}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={handleMessages}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-ca-blue-light text-white">
                    {name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center">
                  <div className="hidden md:block text-sm font-medium mr-1">
                    {name || 'User'}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {role?.charAt(0).toUpperCase() + role?.slice(1) || 'User'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <span className="text-ca-red">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
