
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'gst' | 'itr' | 'roc' | 'other';
  client_id?: string;
  client_name?: string;
  assigned_to?: string[];
  created_by?: string;
  created_at?: string;
  due_date?: string;
  completed_at?: string;
  is_template?: boolean;
  template_id?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  attachments?: string[];
  subtasks?: any[];
  comments?: any[];
  price?: number;
  is_payable_task?: boolean;
  payable_task_type?: string;
  quotation_sent?: boolean;
  payment_status?: 'pending' | 'paid' | 'failed';
  quotation_number?: string;
  is_deleted?: boolean;
}

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
        
        // Transform the data to include client_name
        const transformedTasks = data.map(task => ({
          ...task,
          client_name: task.clients?.name || null,
        }));

        return transformedTasks || [];
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
