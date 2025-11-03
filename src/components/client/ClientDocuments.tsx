import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDocuments } from '@/hooks/useDocuments';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Download, Search, Trash2, Archive, MoreVertical, X } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';

interface ClientDocumentsProps {
  clientId?: string;
}

export const ClientDocuments = ({ clientId: propClientId }: ClientDocumentsProps) => {
  const { id: routeClientId } = useParams();
  const clientId = propClientId || routeClientId;
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  const {
    documents,
    total,
    isLoading,
    uploadDocument,
    deleteDocument,
    downloadDocument
  } = useDocuments(clientId);

  const filteredDocuments = documents.filter(doc =>
    doc.documentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = async (file: File, metadata: any) => {
    if (!clientId) {
      toast({ title: "Error", description: "Client ID is required", variant: "destructive" });
      return;
    }

    try {
      // Map frontend categories to backend enum values
      const categoryMap: Record<string, string> = {
        'financial': 'financial_statement',
        'tax': 'tax_document',
        'legal': 'contract',
        'identity': 'identity_proof',
        'bank': 'financial_statement',
        'invoice': 'invoice',
        'receipt': 'receipt',
        'other': 'other'
      };

      await uploadDocument({
        file,
        documentData: {
          clientId,
          documentName: metadata.name || file.name,
          documentType: (categoryMap[metadata.category] || 'other') as any,
          description: metadata.notes || '',
          isConfidential: metadata.isConfidential || false
        }
      });
      setShowUpload(false);
      toast({ title: "Success", description: "Document uploaded successfully" });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: "Error", description: "Failed to upload document", variant: "destructive" });
    }
  };

  const handleDownload = async (document: any) => {
    try {
      // Use the API download endpoint to track downloads
      await downloadDocument(document._id);
      
      // Create download link using the API endpoint
      const link = window.document.createElement('a');
      link.href = `/api/documents/${document._id}/download`;
      link.download = document.originalFileName;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600">Manage client documents and files</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {total} Documents
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Upload your first document to get started'}
            </p>
            <Button onClick={() => setShowUpload(true)}>Upload Document</Button>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <Card key={document._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate" title={document.documentName}>
                      {document.documentName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {document.fileExtension?.toUpperCase()} • {Math.round(document.fileSize / 1024)} KB
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDocument(document._id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {document.documentType?.replace('_', ' ') || 'Document'}
                  </Badge>
                  
                  {document.description && (
                    <p className="text-xs text-gray-600 line-clamp-2" title={document.description}>
                      {document.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Uploaded by {document.uploadedBy?.fullName || 'Unknown'}
                  </div>
                  
                  {document.isConfidential && (
                    <Badge variant="destructive" className="text-xs">
                      Confidential
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DocumentUpload onUpload={handleUpload} clientId={clientId} />
          </div>
        </div>
      )}
    </div>
  );
};
