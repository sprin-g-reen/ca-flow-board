import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from 'sonner';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  type: 'task_assigned' | 'task_due_soon' | 'task_overdue' | 'task_completed' | 'task_updated' | 'client_document_uploaded' | 'payment_received' | 'system_announcement';
  title: string;
  message: string;
  relatedEntity?: {
    entityType: 'Task' | 'Client' | 'Invoice' | 'Payment' | 'Document';
    entityId: string;
  };
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  emailSent: boolean;
  emailSentAt?: string;
  reminderCount: number;
  lastReminderAt?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export const useNotifications = (options: {
  status?: 'unread' | 'read' | 'archived';
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
} = {}) => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', options],
    queryFn: async () => {
      const params: any = {
        offset: (options.offset || 0).toString(),
        limit: (options.limit || 20).toString(),
        ...(options.status && { status: options.status }),
        ...(options.unreadOnly && { unreadOnly: 'true' })
      };

      const response = await api.get('/notifications', params) as any;
      return response;
    },
    enabled: options.enabled !== false,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000 // Consider data stale after 10 seconds
  });

  // Get unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count') as any;
      return response.count;
    },
    refetchInterval: 30000,
    enabled: options.enabled !== false
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification marked as read');
    },
    onError: (error: any) => {
      toast.error('Failed to mark notification as read');
      console.error('Mark as read error:', error);
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/mark-all-read');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error('Failed to mark all notifications as read');
      console.error('Mark all as read error:', error);
    }
  });

  // Archive notification mutation
  const archiveNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.put(`/notifications/${notificationId}/archive`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification archived');
    },
    onError: (error: any) => {
      toast.error('Failed to archive notification');
      console.error('Archive notification error:', error);
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete notification');
      console.error('Delete notification error:', error);
    }
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.post(`/notifications/${notificationId}/remind`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Reminder sent');
    },
    onError: (error: any) => {
      toast.error('Failed to send reminder');
      console.error('Send reminder error:', error);
    }
  });

  // Test email configuration (admin only)
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/notifications/test-email') as any;
      return response;
    },
    onSuccess: (data: any) => {
      if (data.connectionTest?.success && data.emailTest?.success) {
        toast.success('Email configuration is working correctly');
      } else {
        toast.error('Email configuration test failed');
      }
    },
    onError: (error: any) => {
      toast.error('Failed to test email configuration');
      console.error('Test email error:', error);
    }
  });

  // Create manual notification (admin only)
  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: {
      recipientId: string;
      type?: string;
      title: string;
      message: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      sendEmail?: boolean;
    }) => {
      const response = await api.post('/notifications/create', notificationData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create notification');
      console.error('Create notification error:', error);
    }
  });

  const notificationData = data as NotificationResponse | undefined;
  const unreadCount = unreadCountData as number | undefined;

  return {
    // Data
    notifications: notificationData?.notifications || [],
    total: notificationData?.total || 0,
    unreadCount: unreadCount || 0,
    hasMore: notificationData?.hasMore || false,
    
    // States
    isLoading,
    error,
    
    // Actions
    refetch,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    archiveNotification: archiveNotificationMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    sendReminder: sendReminderMutation.mutateAsync,
    testEmail: testEmailMutation.mutateAsync,
    createNotification: createNotificationMutation.mutateAsync,
    
    // Loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isArchiving: archiveNotificationMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isSendingReminder: sendReminderMutation.isPending,
    isTestingEmail: testEmailMutation.isPending,
    isCreating: createNotificationMutation.isPending
  };
};