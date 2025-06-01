
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AutomationSettings {
  id: string;
  auto_invoice_generation: boolean | null;
  deadline_reminders_enabled: boolean | null;
  whatsapp_notifications: boolean | null;
  reminder_days_before: number | null;
  created_at: string;
  updated_at: string;
}

export const useAutomation = () => {
  const queryClient = useQueryClient();

  // Get automation settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['automation-settings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('automation_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching automation settings:', error);
        throw error;
      }
      return data as AutomationSettings | null;
    },
  });

  // Generate recurring tasks
  const generateRecurringTasks = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-recurring-tasks');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Auto-generate invoice after task completion
  const autoGenerateInvoice = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase.functions.invoke('auto-generate-invoice', {
        body: { taskId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Send deadline reminders
  const sendDeadlineReminders = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-deadline-reminders');
      if (error) throw error;
      return data;
    },
  });

  // Send WhatsApp notification
  const sendWhatsAppNotification = useMutation({
    mutationFn: async ({ phoneNumber, message, clientId }: { phoneNumber: string; message: string; clientId: string }) => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: { phoneNumber, message, clientId }
      });
      if (error) throw error;
      return data;
    },
  });

  // Update automation settings
  const updateSettings = useMutation({
    mutationFn: async (settingsData: Partial<AutomationSettings>) => {
      const { data, error } = await (supabase as any)
        .from('automation_settings')
        .upsert({ ...settingsData, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) {
        console.error('Error updating automation settings:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-settings'] });
    },
  });

  return {
    settings,
    isLoadingSettings,
    generateRecurringTasks: generateRecurringTasks.mutate,
    isGenerating: generateRecurringTasks.isPending,
    autoGenerateInvoice: autoGenerateInvoice.mutate,
    isGeneratingInvoice: autoGenerateInvoice.isPending,
    sendDeadlineReminders: sendDeadlineReminders.mutate,
    isSendingReminders: sendDeadlineReminders.isPending,
    sendWhatsAppNotification: sendWhatsAppNotification.mutate,
    isSendingWhatsApp: sendWhatsAppNotification.isPending,
    updateSettings: updateSettings.mutate,
    isUpdatingSettings: updateSettings.isPending,
  };
};
