
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

const API_BASE_URL = 'http://localhost:3001/api';

import { getValidatedToken } from '@/lib/auth';

// Helper function to make authenticated API calls
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = getValidatedToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const useRecurringTasks = () => {
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['recurring-schedules'],
    queryFn: async () => {
      try {
        console.log('Fetching recurring schedules...');
        const response = await makeAuthenticatedRequest('/tasks/recurring-schedules');
        console.log('Recurring schedules response:', response);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching recurring schedules:', error);
        // Don't throw error for this optional feature
        console.log('Recurring schedules feature not fully implemented yet, returning empty array');
        return [];
      }
    },
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
    enabled: false, // Disable automatic fetching for now
  });

  const createRecurringSchedule = useMutation({
    mutationFn: async (scheduleData: CreateRecurringScheduleData) => {
      const response = await makeAuthenticatedRequest('/tasks/recurring-schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
    },
  });

  const generateRecurringTasks = useMutation({
    mutationFn: async () => {
      console.log('Generating recurring tasks...');
      
      const response = await makeAuthenticatedRequest('/tasks/generate-recurring', {
        method: 'POST',
      });

      console.log('Generated tasks:', response.data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const generatedCount = response.data?.length || 0;
      console.log(`Recurring task generation completed. Generated ${generatedCount} tasks`);
      
      // Return the response for the component to use
      return response;
    },
    onError: (error) => {
      console.error('Recurring task generation failed:', error);
    },
  });  return {
    schedules,
    isLoading,
    createRecurringSchedule: createRecurringSchedule.mutate,
    isCreating: createRecurringSchedule.isPending,
    generateRecurringTasks: generateRecurringTasks.mutateAsync,
    isGenerating: generateRecurringTasks.isPending,
  };
};
