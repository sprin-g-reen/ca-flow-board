import { useState, useRef, useEffect } from 'react';
import { Upload, File, Download, Trash2, User, Calendar, HardDrive, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Task } from '@/store/slices/tasksSlice';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getValidatedToken } from '@/lib/auth';
import { API_BASE_URL } from '@/config/api.config';

interface TaskDocumentsProps {
  task: Task;
}

interface Document {
  _id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  uploadedAt: string;
  url: string;
}

export default function TaskDocuments({ task }: TaskDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const taskId = task.id || (task as any)._id;

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [taskId]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = getValidatedToken();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('document') || type.includes('word')) return '📝';
    return '📁';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const token = getValidatedToken();
      
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          // Show specific error message from server
          throw new Error(data.message || `Failed to upload ${file.name}`);
        }

        toast.success(`${file.name} uploaded successfully`);
      }

      // Refresh documents list
      await fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (document: Document) => {
    // Open document URL in new tab
    const fullUrl = document.url.startsWith('http') 
      ? document.url 
      : `${window.location.origin}${document.url}`;
    window.open(fullUrl, '_blank');
    toast.success(`Opening ${document.name}...`);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = getValidatedToken();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Select files to upload
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isUploading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB per file)
              </p>
            </div>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Choose Files'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <p className="text-sm text-gray-400">Upload files to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">
                      {getFileIcon(document.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {document.name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(document.size)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(document.uploadedAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                          {(document.uploadedBy?.fullName || 'U')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                          }
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">
                        {document.uploadedBy?.fullName || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document._id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">Upload Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Maximum file size: 10MB per file</li>
            <li>• Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</li>
            <li>• Files are automatically scanned for security</li>
            <li>• All uploads are logged with user information and timestamp</li>
            <li>• Documents are accessible to all assigned team members</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}