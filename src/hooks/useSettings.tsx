import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, AllSettings } from '@/services/settings';
import { useToast } from '@/hooks/use-toast';

export interface UseSettingsOptions {
  category?: keyof AllSettings;
  autoSave?: boolean;
  saveDelay?: number;
}

export const useSettings = (options: UseSettingsOptions = {}) => {
  const { category, autoSave = true, saveDelay = 1000 } = options;
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, any>>({});
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch settings
  const {
    data: settings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['settings', category],
    queryFn: async () => {
      try {
        return category ? await settingsService.getSettings(category) : await settingsService.getAllSettings();
      } catch (err: any) {
        // Silently handle 403 errors for employees who don't have access to settings
        if (err.message?.includes('Access denied') || err.message?.includes('403')) {
          console.log('⚠️ Settings access denied (employee role) - using defaults');
          return category ? {} : { company: {}, notification: {}, security: {}, integration: {} };
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: false, // Don't retry on 403
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: ({ category: cat, data }: { category: keyof AllSettings; data: any }) =>
      settingsService.updateSettings(cat, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['settings', variables.category], data);
      queryClient.setQueryData(['settings'], (old: AllSettings | undefined) => {
        if (!old) return old;
        return { ...old, [variables.category]: data };
      });
      setUnsavedChanges({});
      toast({
        title: "Settings Updated",
        description: `${variables.category} settings have been saved successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update individual setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: ({ category: cat, key, value }: { category: keyof AllSettings; key: string; value: any }) =>
      settingsService.updateSetting(cat, key, value),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['settings', variables.category], (old: any) => {
        if (!old) return old;
        return { ...old, [variables.key]: variables.value };
      });
      queryClient.setQueryData(['settings'], (old: AllSettings | undefined) => {
        if (!old) return old;
        return {
          ...old,
          [variables.category]: {
            ...old[variables.category],
            [variables.key]: variables.value
          }
        };
      });
      setUnsavedChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[`${variables.category}.${variables.key}`];
        return newChanges;
      });
      toast({
        title: "Setting Updated",
        description: `${variables.key} has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset settings mutation
  const resetMutation = useMutation({
    mutationFn: (cat?: keyof AllSettings) => settingsService.resetSettings(cat),
    onSuccess: (data, variables) => {
      if (variables) {
        queryClient.setQueryData(['settings', variables], data);
      } else {
        queryClient.setQueryData(['settings'], data);
      }
      setUnsavedChanges({});
      toast({
        title: "Settings Reset",
        description: "Settings have been reset to default values.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export settings mutation
  const exportMutation = useMutation({
    mutationFn: () => settingsService.exportSettings(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ca-flow-board-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Settings Exported",
        description: "Settings have been exported successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update settings with optional auto-save
  const updateSettings = (cat: keyof AllSettings, data: any, immediate = false) => {
    const changeKey = `${cat}`;
    setUnsavedChanges(prev => ({ ...prev, [changeKey]: data }));

    if (autoSave && !immediate) {
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save
      const newTimeout = setTimeout(() => {
        updateMutation.mutate({ category: cat, data });
      }, saveDelay);

      setSaveTimeout(newTimeout);
    } else if (immediate) {
      updateMutation.mutate({ category: cat, data });
    }
  };

  // Update individual setting with optional auto-save
  const updateSetting = (cat: keyof AllSettings, key: string, value: any, immediate = false) => {
    const changeKey = `${cat}.${key}`;
    setUnsavedChanges(prev => ({ ...prev, [changeKey]: value }));

    if (autoSave && !immediate) {
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save
      const newTimeout = setTimeout(() => {
        updateSettingMutation.mutate({ category: cat, key, value });
      }, saveDelay);

      setSaveTimeout(newTimeout);
    } else if (immediate) {
      updateSettingMutation.mutate({ category: cat, key, value });
    }
  };

  // Save all unsaved changes immediately
  const saveChanges = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }

    Object.entries(unsavedChanges).forEach(([key, value]) => {
      if (key.includes('.')) {
        const [cat, settingKey] = key.split('.');
        updateSettingMutation.mutate({ 
          category: cat as keyof AllSettings, 
          key: settingKey, 
          value 
        });
      } else {
        updateMutation.mutate({ 
          category: key as keyof AllSettings, 
          data: value 
        });
      }
    });
  };

  // Discard unsaved changes
  const discardChanges = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    setUnsavedChanges({});
    toast({
      title: "Changes Discarded",
      description: "Unsaved changes have been discarded.",
    });
  };

  // Reset settings to default
  const resetSettings = (cat?: keyof AllSettings) => {
    resetMutation.mutate(cat);
  };

  // Export settings
  const exportSettings = () => {
    exportMutation.mutate();
  };

  // Import settings
  const importSettings = async (file: File) => {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate the imported settings structure
      const defaultSettings = settingsService.getDefaultSettings();
      const validatedSettings: Partial<AllSettings> = {};
      
      Object.keys(defaultSettings).forEach((key) => {
        if (importedSettings[key]) {
          validatedSettings[key as keyof AllSettings] = importedSettings[key];
        }
      });

      // Import the settings
      await settingsService.importSettings(validatedSettings);
      
      // Refresh the cache
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      
      toast({
        title: "Settings Imported",
        description: "Settings have been imported successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import settings. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  // Get setting value with fallback to default
  const getSetting = (cat: keyof AllSettings, key: string) => {
    const categorySettings = settings?.[cat];
    const unsavedValue = unsavedChanges[`${cat}.${key}`];
    
    if (unsavedValue !== undefined) {
      return unsavedValue;
    }
    
    if (categorySettings && categorySettings[key] !== undefined) {
      return categorySettings[key];
    }
    
    // Fallback to default
    const defaultSettings = settingsService.getDefaultSettings();
    return defaultSettings[cat]?.[key];
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  return {
    // Data
    settings: settings || settingsService.getDefaultSettings(),
    isLoading,
    error,
    unsavedChanges,
    hasUnsavedChanges: Object.keys(unsavedChanges).length > 0,
    
    // Actions
    updateSettings,
    updateSetting,
    saveChanges,
    discardChanges,
    resetSettings,
    exportSettings,
    importSettings,
    getSetting,
    refetch,
    
    // Mutation states
    isUpdating: updateMutation.isPending || updateSettingMutation.isPending,
    isResetting: resetMutation.isPending,
    isExporting: exportMutation.isPending,
  };
};