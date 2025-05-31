
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  billing_address?: string;
  shipping_address?: string;
  company_registration_number?: string;
  gst_number?: string;
  pan_number?: string;
  business_type?: string;
  industry?: string;
  website?: string;
  notes?: string;
  client_code?: string;
  status?: string;
  payment_terms?: number;
  credit_limit?: number;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientCommunication {
  id: string;
  client_id: string;
  communication_type: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'document';
  subject?: string;
  message?: string;
  sender_id?: string;
  recipient_email?: string;
  recipient_phone?: string;
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  metadata?: any;
  attachments?: string[];
}

interface ClientDocument {
  id: string;
  client_id: string;
  document_name: string;
  document_type: string;
  file_path?: string;
  file_size?: number;
  status: 'active' | 'expired' | 'archived';
  created_at: string;
  expiry_date?: string;
}

interface ClientContact {
  id: string;
  client_id: string;
  contact_name: string;
  designation?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  department?: string;
  notes?: string;
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
      toast.success('Client created successfully');
    },
    onError: () => {
      toast.error('Failed to create client');
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating client:', error);
          throw error;
        }

        return data;
      } catch (err) {
        console.error('Client update error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: () => {
      toast.error('Failed to update client');
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (clientId: string) => {
      try {
        const { error } = await supabase
          .from('clients')
          .update({ is_deleted: true })
          .eq('id', clientId);

        if (error) {
          console.error('Error deleting client:', error);
          throw error;
        }
      } catch (err) {
        console.error('Client delete error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete client');
    },
  });

  return {
    clients,
    isLoading,
    error,
    addClient: addClient.mutate,
    updateClient: updateClient.mutate,
    deleteClient: deleteClient.mutate,
    isAdding: addClient.isPending,
    isUpdating: updateClient.isPending,
    isDeleting: deleteClient.isPending,
  };
};

// Hook for client communications
export const useClientCommunications = (clientId?: string) => {
  const queryClient = useQueryClient();

  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['client-communications', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        const { data, error } = await supabase
          .from('client_communications')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Communications fetch error:', err);
        return [];
      }
    },
    enabled: !!clientId,
  });

  const addCommunication = useMutation({
    mutationFn: async (communicationData: Partial<ClientCommunication>) => {
      try {
        const { data, error } = await supabase
          .from('client_communications')
          .insert([communicationData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Communication add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-communications'] });
      toast.success('Communication logged successfully');
    },
  });

  return {
    communications,
    isLoading,
    addCommunication: addCommunication.mutate,
    isAdding: addCommunication.isPending,
  };
};

// Hook for client documents
export const useClientDocuments = (clientId?: string) => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        const { data, error } = await supabase
          .from('client_documents')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Documents fetch error:', err);
        return [];
      }
    },
    enabled: !!clientId,
  });

  const addDocument = useMutation({
    mutationFn: async (documentData: Partial<ClientDocument>) => {
      try {
        const { data, error } = await supabase
          .from('client_documents')
          .insert([documentData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Document add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast.success('Document added successfully');
    },
  });

  return {
    documents,
    isLoading,
    addDocument: addDocument.mutate,
    isAdding: addDocument.isPending,
  };
};

// Hook for client contacts
export const useClientContacts = (clientId?: string) => {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['client-contacts', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        const { data, error } = await supabase
          .from('client_contacts')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_deleted', false)
          .order('is_primary', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Contacts fetch error:', err);
        return [];
      }
    },
    enabled: !!clientId,
  });

  const addContact = useMutation({
    mutationFn: async (contactData: Partial<ClientContact>) => {
      try {
        const { data, error } = await supabase
          .from('client_contacts')
          .insert([contactData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Contact add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      toast.success('Contact added successfully');
    },
  });

  return {
    contacts,
    isLoading,
    addContact: addContact.mutate,
    isAdding: addContact.isPending,
  };
};
