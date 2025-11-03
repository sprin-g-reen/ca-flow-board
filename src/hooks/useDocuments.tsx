import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from 'sonner';

export interface Document {
  _id: string;
  clientId: string;
  documentName: string;
  documentType: 'identity_proof' | 'address_proof' | 'business_registration' | 'tax_document' | 'financial_statement' | 'contract' | 'invoice' | 'receipt' | 'correspondence' | 'other';
  originalFileName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  description?: string;
  tags: string[];
  status: 'active' | 'expired' | 'archived';
  expiryDate?: string;
  isConfidential: boolean;
  downloadCount: number;
  lastDownloadedAt?: string;
  lastDownloadedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  firmId: string;
  uploadedBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  fileUrl: string;
}

export interface DocumentsResponse {
  success: boolean;
  documents: Document[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UploadDocumentData {
  clientId: string;
  documentName: string;
  documentType: Document['documentType'];
  description?: string;
  tags?: string[];
  isConfidential?: boolean;
  expiryDate?: string;
}

export const useDocuments = (clientId?: string, options: {
  page?: number;
  limit?: number;
  documentType?: string;
  status?: string;
  enabled?: boolean;
} = {}) => {
  const queryClient = useQueryClient();

  // Fetch documents
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents', clientId, options],
    queryFn: async () => {
      if (!clientId) {
        return { documents: [], total: 0, page: 1, totalPages: 1 };
      }

      const params: any = {
        page: (options.page || 1).toString(),
        limit: (options.limit || 20).toString(),
        ...(options.documentType && { documentType: options.documentType }),
        ...(options.status && { status: options.status })
      };

      const response = await api.get(`/documents/client/${clientId}`, params) as any;
      return {
        documents: response.data || [],
        total: response.pagination?.total || 0,
        page: response.pagination?.current || 1,
        totalPages: response.pagination?.pages || 1
      };
    },
    enabled: options.enabled !== false && !!clientId,
    staleTime: 30000 // Consider data stale after 30 seconds
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, documentData }: { file: File; documentData: UploadDocumentData }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentName', documentData.documentName);
      formData.append('documentType', documentData.documentType);
      
      if (documentData.description) {
        formData.append('description', documentData.description);
      }
      
      if (documentData.tags && documentData.tags.length > 0) {
        formData.append('tags', JSON.stringify(documentData.tags));
      }
      
      if (documentData.isConfidential !== undefined) {
        formData.append('isConfidential', documentData.isConfidential.toString());
      }
      
      if (documentData.expiryDate) {
        formData.append('expiryDate', documentData.expiryDate);
      }

      const response = await api.upload(`/documents/client/${documentData.clientId}/upload`, formData) as any;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    }
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ documentId, updateData }: { 
      documentId: string; 
      updateData: Partial<Pick<Document, 'documentName' | 'description' | 'tags' | 'isConfidential' | 'expiryDate' | 'status'>>
    }) => {
      const response = await api.put(`/documents/${documentId}`, updateData) as any;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update document');
      console.error('Update error:', error);
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.delete(`/documents/${documentId}`) as any;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete document');
      console.error('Delete error:', error);
    }
  });

  // Download document mutation
  const downloadDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.get(`/documents/${documentId}/download`) as any;
      return response;
    },
    onSuccess: () => {
      // Update download count
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      toast.error('Failed to download document');
      console.error('Download error:', error);
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (documentIds: string[]) => {
      const response = await api.post('/documents/bulk-delete', { documentIds }) as any;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documents deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete documents');
      console.error('Bulk delete error:', error);
    }
  });

  // Archive/restore mutation
  const archiveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, archive }: { documentId: string; archive: boolean }) => {
      const response = await api.put(`/documents/${documentId}/archive`, { archive }) as any;
      return response;
    },
    onSuccess: (_, { archive }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(archive ? 'Document archived successfully' : 'Document restored successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update document status');
      console.error('Archive error:', error);
    }
  });

  const documentsData = data as { documents: Document[]; total: number; page: number; totalPages: number } | undefined;

  return {
    // Data
    documents: documentsData?.documents || [],
    total: documentsData?.total || 0,
    page: documentsData?.page || 1,
    totalPages: documentsData?.totalPages || 1,
    
    // States
    isLoading,
    error,
    
    // Actions
    refetch,
    uploadDocument: uploadDocumentMutation.mutateAsync,
    updateDocument: updateDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    downloadDocument: downloadDocumentMutation.mutateAsync,
    bulkDelete: bulkDeleteMutation.mutateAsync,
    archiveDocument: archiveDocumentMutation.mutateAsync,
    
    // Loading states
    isUploading: uploadDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
    isDownloading: downloadDocumentMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isArchiving: archiveDocumentMutation.isPending
  };
};