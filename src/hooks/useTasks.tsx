
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

export const useTasks = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tasks:', error);
          throw error;
        }

        return data || [];
      } catch (err) {
        console.error('Tasks fetch error:', err);
        return [];
      }
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      try {
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
    updateTaskStatus: updateTaskStatus.mutate,
    isUpdating: updateTaskStatus.isPending,
  };
};
