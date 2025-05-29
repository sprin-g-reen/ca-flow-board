
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
      // Use type assertion for new table access
      const { data, error } = await (supabase as any)
        .from('recurring_task_schedule')
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

      if (error) {
        console.error('Error fetching recurring schedules:', error);
        throw error;
      }

      return data;
    },
  });

  const createRecurringSchedule = useMutation({
    mutationFn: async (scheduleData: CreateRecurringScheduleData) => {
      const { data, error } = await (supabase as any)
        .from('recurring_task_schedule')
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
      
      try {
        const { data, error } = await supabase.rpc('generate_recurring_tasks' as any);

        if (error) {
          console.error('Error generating recurring tasks:', error);
          throw error;
        }

        console.log('Generated tasks:', data);
        return data || [];
      } catch (err) {
        console.error('Failed to generate recurring tasks:', err);
        throw err;
      }
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
