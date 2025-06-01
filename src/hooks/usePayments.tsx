
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePayments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get quotations with client data
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotations:', error);
        throw error;
      }

      return data;
    },
  });

  // Get payments
  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      return data;
    },
  });

  // Create quotation
  const createQuotation = useMutation({
    mutationFn: async (quotationData: any) => {
      // Generate quotation number
      const { data: quotationNumber, error: numberError } = await supabase.rpc('generate_quotation_number');
      
      if (numberError) {
        console.error('Error generating quotation number:', numberError);
        throw numberError;
      }

      const { data, error } = await supabase
        .from('quotations')
        .insert({
          quotation_number: quotationNumber,
          ...quotationData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating quotation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({
        title: "Quotation Created",
        description: "The quotation has been created successfully.",
      });
    },
  });

  // Send via WhatsApp
  const sendViaWhatsApp = useMutation({
    mutationFn: async ({ quotationId, phoneNumber, message }: { quotationId: string; phoneNumber: string; message: string }) => {
      // Update quotation to mark as sent via WhatsApp
      const { error: updateError } = await supabase
        .from('quotations')
        .update({
          sent_via_whatsapp: true,
          whatsapp_sent_at: new Date().toISOString()
        })
        .eq('id', quotationId);

      if (updateError) {
        console.error('Error updating quotation:', updateError);
        throw updateError;
      }

      // Send WhatsApp notification
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: { phoneNumber, message, clientId: quotationId }
      });

      if (error) {
        console.error('Error sending WhatsApp:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({
        title: "WhatsApp Sent",
        description: "Quotation has been sent via WhatsApp.",
      });
    },
  });

  // Create payment link
  const createPaymentLink = useMutation({
    mutationFn: async (quotationId: string) => {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { quotationId }
      });

      if (error) {
        console.error('Error creating payment link:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({
        title: "Payment Link Created",
        description: "Payment link has been created successfully.",
      });
    },
  });

  return {
    quotations,
    payments,
    isLoading,
    createQuotation: createQuotation.mutate,
    isCreating: createQuotation.isPending,
    isCreatingQuotation: createQuotation.isPending,
    sendViaWhatsApp: sendViaWhatsApp.mutate,
    isSendingWhatsApp: sendViaWhatsApp.isPending,
    createPaymentLink: createPaymentLink.mutate,
    isCreatingPayment: createPaymentLink.isPending,
  };
};

export const usePaymentConfigurations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get payment configurations
  const { data: configurations = [], isLoading } = useQuery({
    queryKey: ['payment-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_configurations')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment configurations:', error);
        throw error;
      }

      return data;
    },
  });

  // Update payment configuration
  const updateConfiguration = useMutation({
    mutationFn: async (configData: any) => {
      const { data, error } = await supabase
        .from('payment_configurations')
        .update({
          ...configData,
          updated_at: new Date().toISOString()
        })
        .eq('id', configData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating payment configuration:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-configurations'] });
      toast({
        title: "Configuration Updated",
        description: "Payment configuration has been updated successfully.",
      });
    },
  });

  // Create payment configuration
  const createConfiguration = useMutation({
    mutationFn: async (configData: any) => {
      const { data, error } = await supabase
        .from('payment_configurations')
        .insert(configData)
        .select()
        .single();

      if (error) {
        console.error('Error creating payment configuration:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-configurations'] });
      toast({
        title: "Configuration Created",
        description: "Payment configuration has been created successfully.",
      });
    },
  });

  return {
    configurations,
    isLoading,
    updateConfiguration: updateConfiguration.mutate,
    isUpdating: updateConfiguration.isPending,
    createConfiguration: createConfiguration.mutate,
    isCreating: createConfiguration.isPending,
  };
};
