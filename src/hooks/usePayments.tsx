
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Quotation {
  id: string;
  quotation_number: string;
  task_id?: string;
  client_id?: string;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until?: string;
  payment_terms?: string;
  notes?: string;
  payment_type?: 'payable_task_1' | 'payable_task_2';
  payment_link_id?: string;
  payment_link_url?: string;
  sent_via_whatsapp: boolean;
  whatsapp_sent_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  clients?: { name: string };
  tasks?: { title: string };
}

export interface Payment {
  id: string;
  payment_id: string;
  quotation_id?: string;
  task_id?: string;
  client_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
  payment_method?: string;
  payment_gateway?: 'razorpay_1' | 'razorpay_2' | 'stripe_1' | 'stripe_2';
  gateway_response: any;
  transaction_fee: number;
  receipt_url?: string;
  receipt_sent: boolean;
  receipt_sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  clients?: { name: string; email?: string; phone?: string };
  quotations?: { quotation_number: string; amount: number; tax_amount: number; total_amount: number };
}

export interface PaymentConfiguration {
  id: string;
  config_name: string;
  gateway_type: 'razorpay' | 'stripe';
  is_active: boolean;
  webhook_secret?: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// Quotations hooks
export const useQuotations = () => {
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading, error } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          clients(name),
          tasks(title)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Quotation[];
    },
  });

  const createQuotation = useMutation({
    mutationFn: async (quotationData: Omit<Quotation, 'id' | 'created_at' | 'updated_at' | 'quotation_number'>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('quotations')
        .insert({
          ...quotationData,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation created successfully');
    },
    onError: (error) => {
      console.error('Error creating quotation:', error);
      toast.error('Failed to create quotation');
    },
  });

  const updateQuotation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quotation> & { id: string }) => {
      const { data, error } = await supabase
        .from('quotations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const generatePaymentLink = useMutation({
    mutationFn: async (quotationId: string) => {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { quotationId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Payment link generated successfully');
    },
    onError: (error) => {
      console.error('Error generating payment link:', error);
      toast.error('Failed to generate payment link');
    },
  });

  const sendViaWhatsApp = useMutation({
    mutationFn: async ({ quotationId, phoneNumber }: { quotationId: string; phoneNumber: string }) => {
      // Get quotation details first
      const quotation = quotations.find(q => q.id === quotationId);
      if (!quotation) throw new Error('Quotation not found');

      const message = `Hi! Please find your quotation ${quotation.quotation_number} for ₹${quotation.total_amount.toLocaleString()}. ${quotation.payment_link_url ? `Payment link: ${quotation.payment_link_url}` : ''}`;
      const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
      
      // Update quotation as sent via WhatsApp
      await updateQuotation.mutateAsync({
        id: quotationId,
        sent_via_whatsapp: true,
        whatsapp_sent_at: new Date().toISOString(),
        status: 'sent'
      });

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      return { whatsapp_url: whatsappUrl };
    },
    onSuccess: () => {
      toast.success('Opening WhatsApp to send quotation');
    },
    onError: (error) => {
      console.error('Error sending via WhatsApp:', error);
      toast.error('Failed to prepare WhatsApp message');
    },
  });

  return {
    quotations,
    isLoading,
    error,
    createQuotation: createQuotation.mutate,
    isCreating: createQuotation.isPending,
    updateQuotation: updateQuotation.mutate,
    isUpdating: updateQuotation.isPending,
    generatePaymentLink: generatePaymentLink.mutate,
    isGeneratingLink: generatePaymentLink.isPending,
    sendViaWhatsApp: sendViaWhatsApp.mutate,
    isSendingWhatsApp: sendViaWhatsApp.isPending,
  };
};

// Payments hooks
export const usePayments = () => {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients(name, email, phone),
          quotations(quotation_number, amount, tax_amount, total_amount)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  const sendReceipt = useMutation({
    mutationFn: async ({ paymentId, sendVia }: { paymentId: string; sendVia: 'email' | 'whatsapp' }) => {
      const { data, error } = await supabase.functions.invoke('send-receipt', {
        body: { paymentId, sendVia }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank');
      }
      toast.success('Receipt sent successfully');
    },
    onError: (error) => {
      console.error('Error sending receipt:', error);
      toast.error('Failed to send receipt');
    },
  });

  return {
    payments,
    isLoading,
    error,
    sendReceipt: sendReceipt.mutate,
    isSendingReceipt: sendReceipt.isPending,
  };
};

// Payment Configurations hooks
export const usePaymentConfigurations = () => {
  const queryClient = useQueryClient();

  const { data: configurations = [], isLoading, error } = useQuery({
    queryKey: ['payment-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_configurations')
        .select('*')
        .eq('is_deleted', false)
        .order('config_name');

      if (error) throw error;
      return data as PaymentConfiguration[];
    },
  });

  const updateConfiguration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentConfiguration> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-configurations'] });
      toast.success('Configuration updated successfully');
    },
    onError: (error) => {
      console.error('Error updating configuration:', error);
      toast.error('Failed to update configuration');
    },
  });

  return {
    configurations,
    isLoading,
    error,
    updateConfiguration: updateConfiguration.mutate,
    isUpdating: updateConfiguration.isPending,
  };
};
