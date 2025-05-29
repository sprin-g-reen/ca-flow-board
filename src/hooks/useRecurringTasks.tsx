
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecurringTaskSchedule {
  id: string;
  template_id: string;
  client_id?: string;
  assigned_to: string[];
  last_generated_at?: string;
  next_generation_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringScheduleData {
  template_id: string;
  client_id?: string;
  assigned_to: string[];
  next_generation_date: string;
}

export const useRecurringTasks = () => {
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['recurring-schedules'],
    queryFn: async () => {
      // Use RPC or fallback approach
      const { data, error } = await supabase
        .rpc('get_recurring_schedules')
        .select();

      if (error) {
        console.error('RPC failed, trying direct query:', error);
        // Fallback to direct query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recurring_task_schedule' as any)
          .select(`
            *,
            task_templates (
              title,
              category,
              recurrence_pattern
            )
          `)
          .eq('is_active', true)
          .order('next_generation_date', { ascending: true });

        if (fallbackError) {
          console.error('Error fetching recurring schedules:', fallbackError);
          throw fallbackError;
        }

        return fallbackData;
      }

      return data;
    },
  });

  const createRecurringSchedule = useMutation({
    mutationFn: async (scheduleData: CreateRecurringScheduleData) => {
      const { data, error } = await supabase
        .from('recurring_task_schedule' as any)
        .insert(scheduleData)
        .select()
        .single();

      if (error) {
        console.error('Error creating recurring schedule:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
    },
  });

  const generateRecurringTasks = useMutation({
    mutationFn: async () => {
      console.log('Generating recurring tasks...');
      
      const { data, error } = await supabase.rpc('generate_recurring_tasks');

      if (error) {
        console.error('Error generating recurring tasks:', error);
        throw error;
      }

      console.log('Generated tasks:', data);
      return data || [];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
      console.log(`Generated ${data?.length || 0} recurring tasks`);
    },
  });

  return {
    schedules,
    isLoading,
    createRecurringSchedule: createRecurringSchedule.mutate,
    isCreating: createRecurringSchedule.isPending,
    generateRecurringTasks: generateRecurringTasks.mutate,
    isGenerating: generateRecurringTasks.isPending,
  };
};
