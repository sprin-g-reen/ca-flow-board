
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  client_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  is_active?: boolean;
  usage_count?: number;
  estimated_hours?: number;
  complexity?: 'simple' | 'medium' | 'complex';
  tags?: string[];
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
  client_id?: string;
  estimated_hours?: number;
  complexity?: 'simple' | 'medium' | 'complex';
  tags?: string[];
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

export const useTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templatesResponse, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      console.log('Fetching templates from backend API...');
      
      const response = await makeAuthenticatedRequest('/templates');
      console.log('Templates API response:', response);
      
      return response;
    },
  });

  // Query for a single template (for editing)
  const useTemplate = (templateId: string | null) => {
    return useQuery({
      queryKey: ['template', templateId],
      queryFn: async () => {
        if (!templateId) return null;
        console.log('Fetching template:', templateId);
        
        const response = await makeAuthenticatedRequest(`/templates/${templateId}`);
        console.log('Template API response:', response);
        
        return response.data;
      },
      enabled: !!templateId,
    });
  };

  // Extract templates from the response data
  const templates = templatesResponse?.data || [];

  const createTemplate = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      console.log('Creating template:', templateData);
      
      const response = await makeAuthenticatedRequest('/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });

      console.log('Template created successfully:', response);
      return response.data;
    },
    onSuccess: () => {
      console.log('Invalidating templates query...');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<TaskTemplate> & { id: string }) => {
      console.log('Updating template:', { id, updateData });
      
      const response = await makeAuthenticatedRequest(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      console.log('Template updated successfully:', response);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      console.log('Deleting template:', templateId);
      
      const response = await makeAuthenticatedRequest(`/templates/${templateId}`, {
        method: 'DELETE',
      });

      console.log('Template deleted successfully:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      console.log('Duplicating template:', templateId);
      
      const response = await makeAuthenticatedRequest(`/templates/${templateId}/duplicate`, {
        method: 'POST',
      });

      console.log('Template duplicated successfully:', response);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return {
    templates: templates || [], // Ensure templates is always an array
    isLoading,
    error,
    useTemplate, // Export the single template hook
    createTemplate: createTemplate.mutate,
    isCreating: createTemplate.isPending,
    updateTemplate: updateTemplate.mutate,
    isUpdating: updateTemplate.isPending,
    deleteTemplate: deleteTemplate.mutate,
    isDeleting: deleteTemplate.isPending,
    duplicateTemplate: duplicateTemplate.mutate,
    isDuplicating: duplicateTemplate.isPending,
  };
};
