import React, { useState } from 'react';
import { 
  Bell, 
  BellDot, 
  X, 
  Check, 
  Archive, 
  Trash2, 
  Mail, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Info,
  User,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case 'task_assigned':
      return <User {...iconProps} className="h-4 w-4 text-blue-600" />;
    case 'task_due_soon':
      return <Clock {...iconProps} className="h-4 w-4 text-orange-600" />;
    case 'task_overdue':
      return <AlertCircle {...iconProps} className="h-4 w-4 text-red-600" />;
    case 'task_completed':
      return <CheckCircle2 {...iconProps} className="h-4 w-4 text-green-600" />;
    case 'task_updated':
      return <FileText {...iconProps} className="h-4 w-4 text-indigo-600" />;
    case 'client_document_uploaded':
      return <FileText {...iconProps} className="h-4 w-4 text-purple-600" />;
    case 'payment_received':
      return <DollarSign {...iconProps} className="h-4 w-4 text-green-600" />;
    case 'system_announcement':
      return <Info {...iconProps} className="h-4 w-4 text-blue-600" />;
    default:
      return <Bell {...iconProps} />;
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onArchive, 
  onDelete, 
  onSendReminder,
  isLoading 
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onSendReminder: (id: string) => void;
  isLoading: boolean;
}) => {
  const isUnread = notification.status === 'unread';
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div className={cn(
      "p-4 border-l-4 hover:bg-gray-50 transition-colors",
      isUnread ? "bg-blue-50 border-l-blue-500" : "bg-white border-l-gray-200"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            <NotificationIcon type={notification.type} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                "text-sm font-medium truncate",
                isUnread ? "text-gray-900" : "text-gray-700"
              )}>
                {notification.title}
              </h4>
              {isUnread && (
                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {notification.message}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{timeAgo}</span>
              {notification.sender && (
                <>
                  <span>•</span>
                  <span>by {notification.sender.fullName}</span>
                </>
              )}
              {notification.priority !== 'medium' && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className={cn("text-xs", getPriorityColor(notification.priority))}>
                    {notification.priority}
                  </Badge>
                </>
              )}
              {notification.emailSent && (
                <>
                  <span>•</span>
                  <Mail className="h-3 w-3" />
                </>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 flex-shrink-0"
              disabled={isLoading}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isUnread && (
              <DropdownMenuItem onClick={() => onMarkAsRead(notification._id)}>
                <Check className="h-4 w-4 mr-2" />
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onArchive(notification._id)}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendReminder(notification._id)}>
              <Mail className="h-4 w-4 mr-2" />
              Send reminder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(notification._id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    sendReminder,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isArchiving,
    isDeleting,
    isSendingReminder,
    refetch
  } = useNotifications({
    status: activeTab === 'unread' ? 'unread' : activeTab === 'archived' ? 'archived' : undefined,
    limit: 50
  });

  const isAnyLoading = isMarkingAsRead || isMarkingAllAsRead || isArchiving || isDeleting || isSendingReminder;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveNotification(id);
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSendReminder = async (id: string) => {
    try {
      await sendReminder(id);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellDot className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="p-0">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-8 w-8 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">No notifications</p>
                  <p className="text-xs text-gray-500">
                    {activeTab === 'unread' 
                      ? "You're all caught up!" 
                      : activeTab === 'archived'
                      ? "No archived notifications"
                      : "You'll see notifications here when they arrive"
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                      onSendReminder={handleSendReminder}
                      isLoading={isAnyLoading}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {notifications.length > 0 ? `${notifications.length} notifications` : 'No notifications'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-6 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;