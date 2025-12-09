
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getValidatedToken } from '@/lib/auth';
import { Task, TaskStatus, TaskPriority, TaskCategory, SubTask } from '@/store/slices/tasksSlice';
import { API_BASE_URL } from '@/config/api.config';

interface CreateTaskData {
  title: string;
  description?: string;
  category: 'gst' | 'itr' | 'roc' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'inprogress' | 'review' | 'completed';
  client_id?: string;
  assigned_to?: string[];
  due_date?: string;
  created_by?: string;
  is_payable_task?: boolean;
  price?: number;
  payable_task_type?: string;
  is_deleted?: boolean;
  template_id?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  subtasks?: any[];
  [key: string]: unknown;
}

export const useTasks = () => {
  const queryClient = useQueryClient();
  const [isRealTime, setIsRealTime] = useState(true);

  // Manual refresh function
  const refreshTasks = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    return queryClient.refetchQueries({ queryKey: ['tasks'] });
  };

  // Status mapping function
  const mapDatabaseStatusToType = (dbStatus: string): TaskStatus => {
    switch (dbStatus) {
      case 'pending': return 'todo';
      case 'in_progress': return 'inprogress';
      case 'todo': return 'todo';
      case 'inprogress': return 'inprogress';
      case 'review': return 'review';
      case 'completed': return 'completed';
      default: return 'todo';
    }
  };

  // Category mapping functions
  const mapDatabaseCategoryToType = (dbCategory: string): TaskCategory => {
    switch (dbCategory) {
      case 'gst_filing': return 'gst_filing';
      case 'income_tax_return': return 'itr_filing';
      case 'compliance': return 'roc_filing';
      default: return 'other';
    }
  };

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        console.log('Fetching tasks from backend...');
        
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/tasks?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log('Raw API response:', result);
        
        const tasksData = result.data?.tasks || [];
        console.log('Tasks from API:', tasksData);
        
        // Ensure data is an array before mapping
        if (!Array.isArray(tasksData)) {
          console.warn('Tasks data is not an array, returning empty array');
          return [];
        }
        
        // Transform the data to match the Task interface
        const transformedTasks: Task[] = tasksData.map((task: any) => ({
          id: task._id || task.id,
          title: task.title,
          description: task.description || '',
          status: mapDatabaseStatusToType(task.status),
          priority: task.priority as TaskPriority,
          category: mapDatabaseCategoryToType(task.type),
          clientId: task.client?._id || task.client || '',
          clientName: task.client?.fullName || task.client?.companyName || '',
          assignedTo: (() => {
            if (!task.assignedTo) return [];
            if (Array.isArray(task.assignedTo)) {
              return task.assignedTo.map((user: any) => {
                if (typeof user === 'string') return user; // ID only
                // Return full user object for populated data
                return {
                  _id: user._id || user.id,
                  fullName: user.fullName,
                  email: user.email
                };
              });
            }
            if (typeof task.assignedTo === 'object') {
              return [{
                _id: task.assignedTo._id || task.assignedTo.id,
                fullName: task.assignedTo.fullName,
                email: task.assignedTo.email
              }];
            }
            return typeof task.assignedTo === 'string' ? [task.assignedTo] : [];
          })(),
          collaborators: (() => {
            if (!task.collaborators) return [];
            if (Array.isArray(task.collaborators)) {
              return task.collaborators.map((user: any) => {
                if (typeof user === 'string') return user; // ID only
                // Return full user object for populated data
                return {
                  _id: user._id || user.id,
                  fullName: user.fullName,
                  email: user.email
                };
              });
            }
            return [];
          })(),
          createdBy: task.assignedBy?._id || task.assignedBy || '',
          createdAt: task.createdAt || '',
          dueDate: task.dueDate || '',
          completedAt: task.completedDate,
          isTemplate: false,
          templateId: task.template?._id || task.template,
          parentTaskId: task.parentTask?._id || task.parentTask,
          isRecurring: task.isRecurring || false,
          recurrencePattern: task.recurringPattern?.frequency,
          attachments: Array.isArray(task.documents) ? task.documents : [],
          subtasks: task.customFields?.get?.('subtasks') || [],
          comments: Array.isArray(task.comments) ? task.comments.map((comment: any) => ({
            id: comment._id || comment.id,
            userId: comment.author?._id || comment.author,
            userName: comment.author?.fullName || 'Unknown User',
            message: comment.text,
            timestamp: comment.createdAt,
          })) : [],
          price: task.fixedPrice || task.price,
          isPayableTask: task.billable || false,
          payableTaskType: undefined,
          quotationSent: false,
          paymentStatus: task.invoiced ? 'paid' : 'pending',
          quotationNumber: undefined,
        }));

        console.log('Transformed tasks:', transformedTasks);
        return transformedTasks;
      } catch (err) {
        console.error('Tasks fetch error:', err);
        throw err;
      }
    },
    // Disable polling when realtime is on - WebSocket will handle updates
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true, // Still refetch when window gains focus
    staleTime: 25000, // Consider data stale after 25 seconds
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('Authentication failed')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Real-time effect is now handled by WebSocket in useTaskWebSocket hook
  // Removed polling logic to avoid redundant network requests

  const addTask = useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      try {
        console.log('Adding task via backend API:', taskData);
        
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create task');
        }

        const result = await response.json();
        console.log('Task added successfully:', result.data);
        return result.data;
      } catch (err) {
        console.error('Task add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log('Invalidating tasks query...');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Also refetch to ensure immediate update
      queryClient.refetchQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      try {
        console.log('Updating task status via backend:', { taskId, status });
        
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status,
            completedDate: status === 'completed' ? new Date().toISOString() : undefined
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update task');
        }

        const result = await response.json();
        console.log('Task updated successfully:', result.data);
        return result.data;
      } catch (err) {
        console.error('Task update error:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      // Immediately invalidate and refetch tasks for instant UI update
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.refetchQueries({ queryKey: ['tasks'] });
      console.log('Task status updated, refreshing task list');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<CreateTaskData> }) => {
      try {
        console.log('Updating task via backend:', { taskId, updates });
        
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update task');
        }

        const result = await response.json();
        console.log('Task updated successfully:', result.data);
        return result.data;
      } catch (err) {
        console.error('Task update error:', err);
        throw err;
      }
    },
    onSuccess: async (data) => {
      // Immediately invalidate and refetch tasks for instant UI update
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.refetchQueries({ queryKey: ['tasks'] });
      console.log('Task updated, task list refreshed');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      try {
        console.log('Deleting task via backend:', taskId);
        
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete task');
        }

        const result = await response.json();
        console.log('Task deleted successfully:', result);
        return result;
      } catch (err) {
        console.error('Task delete error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const archiveTask = useMutation({
    mutationFn: async (taskId: string) => {
      try {
        console.log('Archiving task via backend:', taskId);
        
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/archive`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            isArchived: true
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to archive task');
        }

        const result = await response.json();
        console.log('Task archived successfully:', result.data);
        return result.data;
      } catch (err) {
        console.error('Task archive error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const bulkDeleteTasks = useMutation({
    mutationFn: async (taskIds: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> => {
      const token = getValidatedToken();
      const response = await fetch(`${API_BASE_URL}/tasks/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete tasks');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const bulkUpdateTaskStatus = useMutation({
    mutationFn: async ({ 
      taskIds, 
      status 
    }: { 
      taskIds: string[]; 
      status: string 
    }): Promise<{ success: boolean; message: string; modifiedCount: number }> => {
      const token = getValidatedToken();
      const response = await fetch(`${API_BASE_URL}/tasks/bulk-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskIds, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task statuses');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const bulkAssignTasks = useMutation({
    mutationFn: async ({ 
      taskIds, 
      assignedTo 
    }: { 
      taskIds: string[]; 
      assignedTo: string 
    }): Promise<{ success: boolean; message: string; modifiedCount: number }> => {
      const token = getValidatedToken();
      const response = await fetch(`${API_BASE_URL}/tasks/bulk-assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskIds, assignedTo }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign tasks');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const bulkArchiveTasks = useMutation({
    mutationFn: async ({ 
      taskIds, 
      isArchived = true 
    }: { 
      taskIds: string[]; 
      isArchived?: boolean 
    }): Promise<{ success: boolean; message: string; modifiedCount: number }> => {
      const token = getValidatedToken();
      const response = await fetch(`${API_BASE_URL}/tasks/bulk-archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskIds, isArchived }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive tasks');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    isRealTime,
    setIsRealTime,
    refreshTasks, // Manual refresh function
    addTask: addTask.mutate,
    isAdding: addTask.isPending,
    updateTaskStatus: updateTaskStatus.mutate,
    isUpdating: updateTaskStatus.isPending,
    updateTask: updateTask.mutate,
    updateTaskAsync: updateTask.mutateAsync,
    isUpdatingTask: updateTask.isPending,
    deleteTask: deleteTask.mutate,
    isDeleting: deleteTask.isPending,
    archiveTask: archiveTask.mutate,
    isArchiving: archiveTask.isPending,
    // Bulk operations
    bulkDeleteTasks: bulkDeleteTasks.mutateAsync,
    isBulkDeleting: bulkDeleteTasks.isPending,
    bulkUpdateTaskStatus: bulkUpdateTaskStatus.mutateAsync,
    isBulkUpdatingStatus: bulkUpdateTaskStatus.isPending,
    bulkAssignTasks: bulkAssignTasks.mutateAsync,
    isBulkAssigning: bulkAssignTasks.isPending,
    bulkArchiveTasks: bulkArchiveTasks.mutateAsync,
    isBulkArchiving: bulkArchiveTasks.isPending,
  };
};

