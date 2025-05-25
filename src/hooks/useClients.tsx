
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching clients:', error);
          throw error;
        }

        return data || [];
      } catch (err) {
        console.error('Clients fetch error:', err);
        return [];
      }
    },
  });

  const addClient = useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();

        if (error) {
          console.error('Error adding client:', error);
          throw error;
        }

        return data;
      } catch (err) {
        console.error('Client add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    clients,
    isLoading,
    error,
    addClient: addClient.mutate,
    isAdding: addClient.isPending,
  };
};
