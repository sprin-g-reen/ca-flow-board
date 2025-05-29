

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskPriority, TaskCategory, SubTask } from '@/store/slices/tasksSlice';

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
}

export const useTasks = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        console.log('Fetching tasks from database...');
        
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            clients (
              name
            )
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tasks:', error);
          throw error;
        }

        console.log('Fetched tasks:', data);
        
        // Transform the data to match the Task interface
        const transformedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as TaskStatus,
          priority: task.priority as TaskPriority,
          category: task.category as TaskCategory,
          clientId: task.client_id || '',
          clientName: task.clients?.name || task.client_name || '',
          assignedTo: Array.isArray(task.assigned_to) ? task.assigned_to : [],
          createdBy: task.created_by || '',
          createdAt: task.created_at || '',
          dueDate: task.due_date || '',
          completedAt: task.completed_at,
          isTemplate: task.is_template || false,
          templateId: task.template_id,
          parentTaskId: undefined, // This field doesn't exist in DB yet
          isRecurring: task.is_recurring || false,
          recurrencePattern: task.recurrence_pattern,
          attachments: Array.isArray(task.attachments) ? task.attachments : [],
          subtasks: Array.isArray(task.subtasks) ? (task.subtasks as unknown as SubTask[]) : [],
          comments: Array.isArray(task.comments) ? (task.comments as unknown as {
            id: string;
            userId: string;
            userName: string;
            message: string;
            timestamp: string;
          }[]) : [],
          price: task.price,
          isPayableTask: task.is_payable_task || false,
          payableTaskType: task.payable_task_type as 'payable_task_1' | 'payable_task_2' | undefined,
          quotationSent: task.quotation_sent,
          paymentStatus: task.payment_status as 'pending' | 'paid' | 'failed' | undefined,
          quotationNumber: task.quotation_number,
        }));

        return transformedTasks;
      } catch (err) {
        console.error('Tasks fetch error:', err);
        throw err;
      }
    },
  });

  const addTask = useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      try {
        console.log('Adding task to database:', taskData);
        
        const { data, error } = await supabase
          .from('tasks')
          .insert(taskData)
          .select()
          .single();

        if (error) {
          console.error('Error adding task:', error);
          throw error;
        }

        console.log('Task added successfully:', data);
        return data;
      } catch (err) {
        console.error('Task add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log('Invalidating tasks query...');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      try {
        console.log('Updating task status:', { taskId, status });
        
        const { data, error } = await supabase
          .from('tasks')
          .update({ 
            status,
            updated_at: new Date().toISOString(),
            completed_at: status === 'completed' ? new Date().toISOString() : null
          })
          .eq('id', taskId)
          .select()
          .single();

        if (error) {
          console.error('Error updating task:', error);
          throw error;
        }

        console.log('Task updated successfully:', data);
        return data;
      } catch (err) {
        console.error('Task update error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    addTask: addTask.mutate,
    isAdding: addTask.isPending,
    updateTaskStatus: updateTaskStatus.mutate,
    isUpdating: updateTaskStatus.isPending,
  };
};

