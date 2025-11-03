
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clientsAPI, communicationsAPI, documentsAPI, contactsAPI } from '@/services/api';
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
  cin_number?: string;
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

// Function to map backend camelCase fields to frontend snake_case fields
const mapClientData = (backendClient: any) => {
  return {
    id: backendClient._id || backendClient.id,
    name: backendClient.name,
    client_code: backendClient.clientCode,
    contact_person: backendClient.contactPerson,
    email: backendClient.email,
    phone: backendClient.phone,
    address: backendClient.address,
    billing_address: backendClient.billingAddress,
    shipping_address: backendClient.shippingAddress,
    company_registration_number: backendClient.companyRegistrationNumber,
    gst_number: backendClient.gstNumber,
    cin_number: backendClient.cinNumber,
    pan_number: backendClient.panNumber,
    business_type: backendClient.businessType,
    industry: backendClient.industry,
    website: backendClient.website,
    notes: backendClient.notes,
    payment_terms: backendClient.paymentTerms,
    credit_limit: backendClient.creditLimit,
    status: backendClient.status,
    is_deleted: backendClient.isDeleted,
    created_at: backendClient.createdAt,
    updated_at: backendClient.updatedAt,
  };
};

export const useClients = () => {
  const queryClient = useQueryClient();

  // Real-time subscription for clients
  useEffect(() => {
    const channel = supabase
      .channel('clients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const response = await clientsAPI.getClients() as any;
        if (response.success) {
          console.log('Raw client data from API:', response.data);
          // Map backend camelCase fields to frontend snake_case fields
          // Filter out soft-deleted clients (they're in recycle bin)
          const mappedClients = (response.data || [])
            .map(mapClientData)
            .filter(client => !client.is_deleted);
          console.log('Mapped client data (active only):', mappedClients);
          return mappedClients;
        } else {
          console.error('Error fetching clients:', response.message);
          return [];
        }
      } catch (err) {
        console.error('Clients fetch error:', err);
        return [];
      }
    },
  });

  const addClient = useMutation({
    mutationFn: async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const response = await clientsAPI.createClient(clientData) as any;
        if (response.success) {
          return mapClientData(response.data);
        } else {
          throw new Error(response.message || 'Failed to create client');
        }
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
        const response = await clientsAPI.updateClient(id, updates) as any;
        if (response.success) {
          return mapClientData(response.data);
        } else {
          throw new Error(response.message || 'Failed to update client');
        }
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
    mutationFn: async (id: string) => {
      try {
        const response = await clientsAPI.deleteClient(id) as any;
        if (response.success) {
          return response;
        } else {
          throw new Error(response.message || 'Failed to delete client');
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

  const bulkImportClients = useMutation({
    mutationFn: async (clientsData: Array<Record<string, unknown>>) => {
      try {
        const response = await clientsAPI.bulkImport(clientsData) as any;
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to import clients');
        }
      } catch (err) {
        console.error('Bulk import error:', err);
        throw err;
      }
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      const { successful = [], failed = [], duplicates = [] } = results;
      
      if (successful.length > 0) {
        toast.success(`Successfully imported ${successful.length} clients`);
      }
      
      if (duplicates.length > 0) {
        toast.warning(`${duplicates.length} clients were skipped (duplicates found)`);
      }
      
      if (failed.length > 0) {
        toast.error(`${failed.length} clients failed to import`);
      }
      
      if (successful.length === 0 && duplicates.length === 0 && failed.length === 0) {
        toast.info('No clients were processed');
      }
    },
    onError: () => {
      toast.error('Failed to import clients');
    },
  });

  const bulkDeleteClients = useMutation({
    mutationFn: async (clientIds: string[]) => {
      try {
        const response = await clientsAPI.bulkDelete(clientIds) as any;
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to delete clients');
        }
      } catch (err) {
        console.error('Bulk delete error:', err);
        throw err;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Successfully deleted ${result.deletedCount} clients`);
    },
    onError: () => {
      toast.error('Failed to delete clients');
    },
  });

  const bulkUpdateClientStatus = useMutation({
    mutationFn: async ({ clientIds, status }: { clientIds: string[]; status: string }) => {
      try {
        const response = await clientsAPI.bulkUpdateStatus(clientIds, status) as any;
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to update client status');
        }
      } catch (err) {
        console.error('Bulk status update error:', err);
        throw err;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Successfully updated status for ${result.updatedCount} clients`);
    },
    onError: () => {
      toast.error('Failed to update client status');
    },
  });

  const bulkArchiveClients = useMutation({
    mutationFn: async ({ clientIds, archived }: { clientIds: string[]; archived: boolean }) => {
      try {
        const response = await clientsAPI.bulkArchive(clientIds, archived) as any;
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to archive clients');
        }
      } catch (err) {
        console.error('Bulk archive error:', err);
        throw err;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      const action = result.archived ? 'archived' : 'unarchived';
      toast.success(`Successfully ${action} ${result.updatedCount} clients`);
    },
    onError: () => {
      toast.error('Failed to archive clients');
    },
  });

  return {
    clients,
    isLoading,
    error,
    addClient: addClient.mutate,
    updateClient: updateClient.mutate,
    deleteClient: deleteClient.mutate,
    bulkImportClients: bulkImportClients.mutate,
    bulkDeleteClients: bulkDeleteClients.mutate,
    bulkUpdateClientStatus: bulkUpdateClientStatus.mutate,
    bulkArchiveClients: bulkArchiveClients.mutate,
    isAdding: addClient.isPending,
    isUpdating: updateClient.isPending,
    isDeleting: deleteClient.isPending,
    isImporting: bulkImportClients.isPending,
    isBulkDeleting: bulkDeleteClients.isPending,
    isBulkUpdatingStatus: bulkUpdateClientStatus.isPending,
    isBulkArchiving: bulkArchiveClients.isPending,
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
        const response = await communicationsAPI.getClientCommunications(clientId) as any;
        if (response.success) {
          return response.data || [];
        } else {
          throw new Error(response.message || 'Failed to fetch communications');
        }
      } catch (err) {
        console.error('Communications fetch error:', err);
        return [];
      }
    },
    enabled: !!clientId,
  });

  const addCommunication = useMutation({
    mutationFn: async (communicationData: Record<string, unknown>) => {
      if (!clientId) throw new Error('Client ID is required');
      
      try {
        const response = await communicationsAPI.createCommunication(clientId, communicationData) as any;
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to create communication');
        }
      } catch (err) {
        console.error('Communication add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-communications'] });
      toast.success('Communication logged successfully');
    },
    onError: () => {
      toast.error('Failed to log communication');
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (communicationId: string) => {
      try {
        const response = await communicationsAPI.markAsRead(communicationId) as any;
        if (!response.success) {
          throw new Error(response.message || 'Failed to mark as read');
        }
        return response;
      } catch (err) {
        console.error('Mark as read error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-communications'] });
    },
  });

  return {
    communications,
    isLoading,
    addCommunication: addCommunication.mutate,
    markAsRead: markAsRead.mutate,
    isAdding: addCommunication.isPending,
    isMarkingRead: markAsRead.isPending,
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
        const response = await documentsAPI.getClientDocuments(clientId) as any;
        if (response.success) {
          return response.data || [];
        } else {
          throw new Error(response.message || 'Failed to fetch documents');
        }
      } catch (err) {
        console.error('Documents fetch error:', err);
        return [];
      }
    },
    enabled: !!clientId,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ formData }: { formData: FormData }) => {
      if (!clientId) throw new Error('Client ID is required');
      
      try {
        const response = await documentsAPI.uploadDocument(clientId, formData) as any;
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to upload document');
        }
      } catch (err) {
        console.error('Document upload error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload document');
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      try {
        const response = await documentsAPI.deleteDocument(documentId) as any;
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete document');
        }
        return response;
      } catch (err) {
        console.error('Document delete error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete document');
    },
  });

  return {
    documents,
    isLoading,
    uploadDocument: uploadDocument.mutate,
    deleteDocument: deleteDocument.mutate,
    isUploading: uploadDocument.isPending,
    isDeleting: deleteDocument.isPending,
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
        const response = await contactsAPI.getClientContacts(clientId) as any;
        if (response.success) {
          return response.data || [];
        } else {
          throw new Error(response.message || 'Failed to fetch contacts');
        }
      } catch (err) {
        console.error('Contacts fetch error:', err);
        return [];
      }
    },
    enabled: !!clientId,
  });

  const addContact = useMutation({
    mutationFn: async (contactData: Record<string, unknown>) => {
      if (!clientId) throw new Error('Client ID is required');
      
      try {
        const response = await contactsAPI.createContact(clientId, contactData) as any;
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to create contact');
        }
      } catch (err) {
        console.error('Contact add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      toast.success('Contact added successfully');
    },
    onError: () => {
      toast.error('Failed to add contact');
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...contactData }: Record<string, unknown> & { id: string }) => {
      try {
        const response = await contactsAPI.updateContact(id, contactData) as any;
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to update contact');
        }
      } catch (err) {
        console.error('Contact update error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      toast.success('Contact updated successfully');
    },
    onError: () => {
      toast.error('Failed to update contact');
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      try {
        const response = await contactsAPI.deleteContact(contactId) as any;
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete contact');
        }
        return response;
      } catch (err) {
        console.error('Contact delete error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      toast.success('Contact deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete contact');
    },
  });

  const setPrimary = useMutation({
    mutationFn: async (contactId: string) => {
      try {
        const response = await contactsAPI.setPrimaryContact(contactId) as any;
        if (!response.success) {
          throw new Error(response.message || 'Failed to set primary contact');
        }
        return response;
      } catch (err) {
        console.error('Set primary contact error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      toast.success('Primary contact updated successfully');
    },
    onError: () => {
      toast.error('Failed to set primary contact');
    },
  });

  return {
    contacts,
    isLoading,
    addContact: addContact.mutate,
    updateContact: updateContact.mutate,
    deleteContact: deleteContact.mutate,
    setPrimary: setPrimary.mutate,
    isAdding: addContact.isPending,
    isUpdating: updateContact.isPending,
    isDeleting: deleteContact.isPending,
    isSettingPrimary: setPrimary.isPending,
  };
};
