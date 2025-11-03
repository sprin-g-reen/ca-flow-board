import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from 'sonner';

export interface RecurrencePattern {
  _id: string;
  name: string;
  type: 'monthly' | 'yearly' | 'quarterly' | 'custom';
  monthlyConfig?: {
    frequency: number;
    dayOfMonth?: number;
    weekOfMonth?: number;
    dayOfWeek?: number;
    endOfMonth?: boolean;
  };
  yearlyConfig?: {
    frequency: number;
    months: number[];
    dayOfMonth?: number;
    weekOfMonth?: number;
    dayOfWeek?: number;
  };
  quarterlyConfig?: {
    frequency: number;
    monthOfQuarter: number;
    dayOfMonth?: number;
    weekOfMonth?: number;
    dayOfWeek?: number;
  };
  customConfig?: {
    frequency: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
    daysOfWeek: number[];
    daysOfMonth: number[];
    monthsOfYear: number[];
  };
  endCondition: {
    type: 'never' | 'after_occurrences' | 'by_date';
    occurrences?: number;
    endDate?: string;
  };
  description?: string;
  isActive: boolean;
  firm: string;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  frequencyDescription: string;
  createdAt: string;
  updatedAt: string;
}

export const useRecurrencePatterns = (options: {
  type?: 'monthly' | 'yearly' | 'quarterly' | 'custom';
  isActive?: boolean;
  enabled?: boolean;
} = {}) => {
  const queryClient = useQueryClient();

  // Fetch recurrence patterns
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recurrence-patterns', options],
    queryFn: async () => {
      const params: any = {};
      if (options.type) params.type = options.type;
      if (options.isActive !== undefined) params.isActive = options.isActive;

      const response = await api.get('/recurrence-patterns', params) as any;
      return response.data?.patterns || [];
    },
    enabled: options.enabled !== false
  });

  // Create recurrence pattern
  const createPatternMutation = useMutation({
    mutationFn: async (patternData: Partial<RecurrencePattern>) => {
      const response = await api.post('/recurrence-patterns', patternData) as any;
      return response.data?.pattern;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrence-patterns'] });
      toast.success('Recurrence pattern created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create recurrence pattern');
      console.error('Create pattern error:', error);
    }
  });

  // Update recurrence pattern
  const updatePatternMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RecurrencePattern> }) => {
      const response = await api.put(`/recurrence-patterns/${id}`, data) as any;
      return response.data?.pattern;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrence-patterns'] });
      toast.success('Recurrence pattern updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update recurrence pattern');
      console.error('Update pattern error:', error);
    }
  });

  // Delete recurrence pattern
  const deletePatternMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recurrence-patterns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrence-patterns'] });
      toast.success('Recurrence pattern deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete recurrence pattern');
      console.error('Delete pattern error:', error);
    }
  });

  // Create CA presets
  const createPresetsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/recurrence-patterns/create-presets') as any;
      return response.data?.presets;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrence-patterns'] });
      toast.success('CA preset patterns created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create preset patterns');
      console.error('Create presets error:', error);
    }
  });

  // Preview pattern occurrences
  const previewPatternMutation = useMutation({
    mutationFn: async ({ id, startDate, count = 5 }: { 
      id: string; 
      startDate?: string; 
      count?: number;
    }) => {
      const response = await api.post(`/recurrence-patterns/${id}/preview`, {
        startDate,
        count
      }) as any;
      return response.data;
    },
    onError: (error: any) => {
      toast.error('Failed to preview pattern');
      console.error('Preview pattern error:', error);
    }
  });

  return {
    // Data
    patterns: (data as RecurrencePattern[]) || [],
    
    // States
    isLoading,
    error,
    
    // Actions
    refetch,
    createPattern: createPatternMutation.mutateAsync,
    updatePattern: updatePatternMutation.mutateAsync,
    deletePattern: deletePatternMutation.mutateAsync,
    createPresets: createPresetsMutation.mutateAsync,
    previewPattern: previewPatternMutation.mutateAsync,
    
    // Loading states
    isCreating: createPatternMutation.isPending,
    isUpdating: updatePatternMutation.isPending,
    isDeleting: deletePatternMutation.isPending,
    isCreatingPresets: createPresetsMutation.isPending,
    isPreviewing: previewPatternMutation.isPending,
    
    // Preview data
    previewData: previewPatternMutation.data
  };
};