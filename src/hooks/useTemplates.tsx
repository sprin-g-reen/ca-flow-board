
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
  is_deleted?: boolean;
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
      
      // Use rpc call as fallback for new tables
      const { data, error } = await supabase.rpc('get_task_templates') as any;
      
      if (error) {
        // If RPC doesn't exist, try direct query with type assertion
        console.log('RPC not found, trying direct query...');
        const directQuery = await (supabase as any)
          .from('task_templates')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (directQuery.error) {
          console.error('Error fetching templates:', directQuery.error);
          throw directQuery.error;
        }

        console.log('Fetched templates:', directQuery.data);
        return directQuery.data as TaskTemplate[];
      }

      console.log('Fetched templates via RPC:', data);
      return data as TaskTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      console.log('Creating template:', templateData);
      
      const { data, error } = await (supabase as any)
        .from('task_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        throw error;
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
      
      const { data, error } = await (supabase as any)
        .from('task_templates')
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
      
      const { error } = await (supabase as any)
        .from('task_templates')
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
