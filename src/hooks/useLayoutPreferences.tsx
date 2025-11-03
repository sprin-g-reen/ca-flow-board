import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface LayoutPreference {
  _id?: string;
  layoutName: string;
  layoutType: 'task-board' | 'client-view' | 'dashboard';
  isDefault: boolean;
  settings: {
    boardView: 'kanban' | 'list' | 'grid' | 'calendar';
    visibleColumns?: Array<{
      key: string;
      label: string;
      width: number;
      sortable: boolean;
      visible: boolean;
    }>;
    defaultFilters?: {
      status?: string[];
      priority?: string[];
      category?: string[];
      assignedTo?: string[];
    };
    defaultSort?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    cardSize?: 'compact' | 'normal' | 'large';
    showSubtasks?: boolean;
    showClientInfo?: boolean;
    showDueDates?: boolean;
    colorScheme?: 'default' | 'minimal' | 'colorful' | 'dark';
  };
  createdAt?: string;
  updatedAt?: string;
}

import { getValidatedToken } from '@/lib/auth';

const createHeaders = () => {
  const token = getValidatedToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// API functions
const fetchLayoutPreferences = async (layoutType?: string): Promise<LayoutPreference[]> => {
  const url = layoutType 
    ? `${API_BASE}/layouts/type/${layoutType}`
    : `${API_BASE}/layouts`;
    
  const response = await fetch(url, {
    headers: createHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch layout preferences');
  }
  
  const result = await response.json();
  return result.data;
};

const fetchDefaultLayout = async (layoutType: string): Promise<LayoutPreference> => {
  const response = await fetch(`${API_BASE}/layouts/default/${layoutType}`, {
    headers: createHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch default layout');
  }
  
  const result = await response.json();
  return result.data;
};

const createLayoutPreference = async (layout: Omit<LayoutPreference, '_id' | 'createdAt' | 'updatedAt'>): Promise<LayoutPreference> => {
  const response = await fetch(`${API_BASE}/layouts`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(layout),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create layout preference');
  }
  
  const result = await response.json();
  return result.data;
};

const updateLayoutPreference = async ({ id, ...layout }: Partial<LayoutPreference> & { id: string }): Promise<LayoutPreference> => {
  const response = await fetch(`${API_BASE}/layouts/${id}`, {
    method: 'PUT',
    headers: createHeaders(),
    body: JSON.stringify(layout),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update layout preference');
  }
  
  const result = await response.json();
  return result.data;
};

const deleteLayoutPreference = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/layouts/${id}`, {
    method: 'DELETE',
    headers: createHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete layout preference');
  }
};

const setDefaultLayout = async (id: string): Promise<LayoutPreference> => {
  const response = await fetch(`${API_BASE}/layouts/${id}/default`, {
    method: 'PATCH',
    headers: createHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to set default layout');
  }
  
  const result = await response.json();
  return result.data;
};

// Main hook
export const useLayoutPreferences = (layoutType?: string) => {
  const queryClient = useQueryClient();
  
  // Fetch all layouts or layouts by type
  const {
    data: layouts = [],
    isLoading: isLoadingLayouts,
    error: layoutsError
  } = useQuery({
    queryKey: ['layouts', layoutType],
    queryFn: () => fetchLayoutPreferences(layoutType),
  enabled: !!getValidatedToken(),
  });
  
  // Fetch default layout for a specific type
  const {
    data: defaultLayout,
    isLoading: isLoadingDefault,
    error: defaultError
  } = useQuery({
    queryKey: ['defaultLayout', layoutType],
    queryFn: () => fetchDefaultLayout(layoutType!),
  enabled: !!layoutType && !!getValidatedToken(),
  });
  
  // Create layout mutation
  const createMutation = useMutation({
    mutationFn: createLayoutPreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      queryClient.invalidateQueries({ queryKey: ['defaultLayout'] });
    },
  });
  
  // Update layout mutation
  const updateMutation = useMutation({
    mutationFn: updateLayoutPreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      queryClient.invalidateQueries({ queryKey: ['defaultLayout'] });
    },
  });
  
  // Delete layout mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLayoutPreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      queryClient.invalidateQueries({ queryKey: ['defaultLayout'] });
    },
  });
  
  // Set default layout mutation
  const setDefaultMutation = useMutation({
    mutationFn: setDefaultLayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      queryClient.invalidateQueries({ queryKey: ['defaultLayout'] });
    },
  });
  
  return {
    // Data
    layouts,
    defaultLayout,
    
    // Loading states
    isLoadingLayouts,
    isLoadingDefault,
    isLoading: isLoadingLayouts || isLoadingDefault,
    
    // Errors
    layoutsError,
    defaultError,
    error: layoutsError || defaultError,
    
    // Actions
    createLayout: createMutation.mutate,
    updateLayout: updateMutation.mutate,
    deleteLayout: deleteMutation.mutate,
    setDefault: setDefaultMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSetting: setDefaultMutation.isPending,
    
    // Mutation errors
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    setDefaultError: setDefaultMutation.error,
  };
};

// Hook for managing current layout state
export const useCurrentLayout = (layoutType: string) => {
  const { defaultLayout, isLoadingDefault } = useLayoutPreferences(layoutType);
  const [currentLayout, setCurrentLayout] = useState<LayoutPreference | null>(null);
  
  useEffect(() => {
    if (defaultLayout && !isLoadingDefault) {
      setCurrentLayout(defaultLayout);
    }
  }, [defaultLayout, isLoadingDefault]);
  
  const updateCurrentLayout = (updates: Partial<LayoutPreference['settings']>) => {
    if (currentLayout) {
      setCurrentLayout({
        ...currentLayout,
        settings: {
          ...currentLayout.settings,
          ...updates
        }
      });
    }
  };
  
  return {
    currentLayout,
    setCurrentLayout,
    updateCurrentLayout,
    isLoading: isLoadingDefault,
  };
};