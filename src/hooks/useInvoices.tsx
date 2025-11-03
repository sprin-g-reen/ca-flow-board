import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getValidatedToken } from '@/lib/auth';

interface InvoiceFilters {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  task?: string;
  taxable?: boolean;
  hsn?: string;
  taxRate?: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: 'invoice' | 'quotation' | 'proforma';
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  client: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  firm: string;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  };
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  gst: {
    cgst: number;
    sgst: number;
    igst: number;
    applicable: boolean;
  };
  paymentTerms: string;
  paymentMethod: string;
  notes?: string;
  terms?: string;
  isOverdue?: boolean;
  daysOverdue?: number;
  createdAt: string;
  updatedAt: string;
}

interface InvoicesResponse {
  success: boolean;
  data: Invoice[];
  pagination: {
    current: number;
    total: number;
    count: number;
    limit: number;
  };
}

interface InvoiceResponse {
  success: boolean;
  data: Invoice;
  message?: string;
}

export const useInvoices = (filters: InvoiceFilters = {}) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async (): Promise<InvoicesResponse> => {
  const token = getValidatedToken();
      const searchParams = new URLSearchParams();
      
      if (filters.search) searchParams.append('search', filters.search);
      if (filters.status) searchParams.append('status', filters.status);
      if (filters.sortBy) searchParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder);
      if (filters.page) searchParams.append('page', filters.page.toString());
      if (filters.limit) searchParams.append('limit', filters.limit.toString());

      const response = await fetch(`http://localhost:3001/api/invoices?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      return response.json();
    },
    enabled: isAuthenticated,
  });
};

export const useInvoice = (invoiceId: string | undefined) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async (): Promise<InvoiceResponse> => {
      const token = getValidatedToken();
      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      return response.json();
    },
    enabled: isAuthenticated && !!invoiceId,
  });
};

export const useCreateInvoice = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData: Partial<Invoice>): Promise<InvoiceResponse> => {
      const token = getValidatedToken();
      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useUpdateInvoice = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      data 
    }: { 
      invoiceId: string; 
      data: Partial<Invoice> 
    }): Promise<InvoiceResponse> => {
      const token = getValidatedToken();
      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};

export const useDeleteInvoice = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string): Promise<{ success: boolean; message: string }> => {
      const token = getValidatedToken();
      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useUpdateInvoiceStatus = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      status 
    }: { 
      invoiceId: string; 
      status: Invoice['status'] 
    }): Promise<InvoiceResponse> => {
      const token = getValidatedToken();
      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};

export const useAddPayment = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      payment 
    }: { 
      invoiceId: string; 
      payment: {
        amount: number;
        method: string;
        reference?: string;
        notes?: string;
      }
    }): Promise<InvoiceResponse> => {
      const token = getValidatedToken();
      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
      });

      if (!response.ok) {
        throw new Error('Failed to add payment');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};

export const useBulkDeleteInvoices = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceIds: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> => {
      const token = getValidatedToken();
      const response = await fetch('http://localhost:3001/api/invoices/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoices');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useBulkUpdateInvoiceStatus = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceIds, 
      status 
    }: { 
      invoiceIds: string[]; 
      status: string 
    }): Promise<{ success: boolean; message: string; modifiedCount: number }> => {
      const token = getValidatedToken();
      const response = await fetch('http://localhost:3001/api/invoices/bulk-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice statuses');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};