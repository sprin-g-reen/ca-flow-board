
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Quotation {
  id: string;
  quotation_number: string;
  task_id: string;
  client_id: string;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until?: string;
  payment_terms?: string;
  notes?: string;
  payment_type?: string;
  sent_via_whatsapp: boolean;
  whatsapp_sent_at?: string;
  payment_link_id?: string;
  payment_link_url?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tasks?: {
    title: string;
  };
  clients?: {
    name: string;
  };
}

interface Payment {
  id: string;
  payment_id: string;
  quotation_id?: string;
  task_id?: string;
  client_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  payment_method?: string;
  payment_gateway?: string;
  transaction_fee?: number;
  gateway_response: any;
  receipt_url?: string;
  receipt_sent: boolean;
  receipt_sent_at?: string;
  paid_at?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentConfiguration {
  id: string;
  config_name: string;
  gateway_type: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  logo_url?: string;
  is_active: boolean;
  is_deleted: boolean;
  webhook_secret?: string;
  created_at: string;
  updated_at: string;
}

export const usePayments = () => {
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading: isLoadingQuotations } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          tasks (
            title
          ),
          clients (
            name
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createQuotation = useMutation({
    mutationFn: async (quotationData: Omit<Quotation, 'id' | 'created_at' | 'updated_at' | 'quotation_number'>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!quotationData.client_id || !quotationData.task_id) {
        throw new Error('Client ID and Task ID are required');
      }

      const dbData = {
        task_id: quotationData.task_id,
        client_id: quotationData.client_id,
        amount: quotationData.amount,
        tax_rate: quotationData.tax_rate,
        tax_amount: quotationData.tax_amount,
        total_amount: quotationData.total_amount,
        status: quotationData.status,
        valid_until: quotationData.valid_until,
        payment_terms: quotationData.payment_terms,
        notes: quotationData.notes,
        payment_type: quotationData.payment_type,
        sent_via_whatsapp: quotationData.sent_via_whatsapp,
        is_deleted: false,
        created_by: userData.user?.id,
      };

      const { data, error } = await supabase
        .from('quotations')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const updateQuotationStatus = useMutation({
    mutationFn: async ({ quotationId, status }: { quotationId: string; status: string }) => {
      const { data, error } = await supabase
        .from('quotations')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quotationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const createPayment = useMutation({
    mutationFn: async (paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  return {
    quotations,
    payments,
    isLoadingQuotations,
    isLoadingPayments,
    createQuotation: createQuotation.mutate,
    isCreating: createQuotation.isPending,
    updateQuotationStatus: updateQuotationStatus.mutate,
    isUpdating: updateQuotationStatus.isPending,
    createPayment: createPayment.mutate,
    isCreatingPayment: createPayment.isPending,
  };
};

export const usePaymentConfigurations = () => {
  const queryClient = useQueryClient();

  const { data: configurations = [], isLoading } = useQuery({
    queryKey: ['payment-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_configurations')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const updateConfiguration = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<PaymentConfiguration> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_configurations')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-configurations'] });
    },
  });

  return {
    configurations,
    isLoading,
    updateConfiguration: updateConfiguration.mutate,
    isUpdating: updateConfiguration.isPending,
  };
};

// Export for backward compatibility
export const useQuotations = usePayments;
