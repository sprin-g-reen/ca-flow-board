
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  category: 'gst' | 'itr' | 'roc' | 'other';
  is_recurring: boolean;
  recurrence_pattern?: 'monthly' | 'yearly' | 'custom';
  deadline?: string;
  subtasks: any[];
  price?: number;
  is_payable_task: boolean;
  payable_task_type?: 'payable_task_1' | 'payable_task_2';
  assigned_employee_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  title: string;
  description?: string;
  category: 'gst' | 'itr' | 'roc' | 'other';
  is_recurring: boolean;
  recurrence_pattern?: 'monthly' | 'yearly' | 'custom';
  deadline?: string;
  subtasks: any[];
  price?: number;
  is_payable_task: boolean;
  payable_task_type?: 'payable_task_1' | 'payable_task_2';
  assigned_employee_id?: string;
}

export const useTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      console.log('Fetching templates from database...');
      
      // Use rpc or direct query approach to avoid type issues
      const { data, error } = await supabase
        .rpc('get_task_templates')
        .select();

      if (error) {
        console.error('Error fetching templates:', error);
        // Fallback to direct query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('task_templates' as any)
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw fallbackError;
        }

        return fallbackData as TaskTemplate[];
      }

      console.log('Fetched templates:', data);
      return data as TaskTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      console.log('Creating template:', templateData);
      
      // Use RPC or direct insert
      const { data, error } = await supabase
        .rpc('create_task_template', templateData)
        .select()
        .single();

      if (error) {
        console.error('RPC failed, trying direct insert:', error);
        // Fallback to direct insert
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('task_templates' as any)
          .insert(templateData)
          .select()
          .single();

        if (fallbackError) {
          console.error('Error creating template:', fallbackError);
          throw fallbackError;
        }

        return fallbackData;
      }

      console.log('Template created successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidating templates query...');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<TaskTemplate> & { id: string }) => {
      console.log('Updating template:', { id, updateData });
      
      const { data, error } = await supabase
        .from('task_templates' as any)
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        throw error;
      }

      console.log('Template updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      console.log('Deleting template:', templateId);
      
      const { error } = await supabase
        .from('task_templates' as any)
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', templateId);

      if (error) {
        console.error('Error deleting template:', error);
        throw error;
      }

      console.log('Template deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate: createTemplate.mutate,
    isCreating: createTemplate.isPending,
    updateTemplate: updateTemplate.mutate,
    isUpdating: updateTemplate.isPending,
    deleteTemplate: deleteTemplate.mutate,
    isDeleting: deleteTemplate.isPending,
  };
};
