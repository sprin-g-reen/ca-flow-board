import { useState, useRef } from 'react';
import { Upload, File, Download, Trash2, User, Calendar, HardDrive } from 'lucide-react';
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

interface TaskDocumentsProps {
  task: Task;
}

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
  url: string;
}

// Mock documents for now - will be replaced with real API
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'GST_Returns_March_2025.pdf',
    size: 2048000,
    type: 'application/pdf',
    uploadedBy: {
      id: '1',
      name: 'Team Member 1',
      email: 'user1@firm.com'
    },
    uploadedAt: '2025-03-15T10:30:00Z',
    url: '#'
  },
  {
    id: '2',
    name: 'Client_Documentation.xlsx',
    size: 1024000,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedBy: {
      id: '2',
      name: 'Team Member 2',
      email: 'user2@firm.com'
    },
    uploadedAt: '2025-03-14T14:20:00Z',
    url: '#'
  }
];

export default function TaskDocuments({ task }: TaskDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

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
      // TODO: Implement actual file upload to your backend
      for (const file of Array.from(files)) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newDocument: Document = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedBy: {
            id: user?.id || '',
            name: user?.fullName || 'Unknown User',
            email: user?.email || ''
          },
          uploadedAt: new Date().toISOString(),
          url: URL.createObjectURL(file) // Temporary URL for demo
        };
        
        setDocuments(prev => [newDocument, ...prev]);
        toast.success(`${file.name} uploaded successfully`);
      }
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (document: Document) => {
    // TODO: Implement actual download functionality
    toast.info(`Downloading ${document.name}...`);
  };

  const handleDelete = (documentId: string) => {
    // TODO: Implement actual delete functionality
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast.success('Document deleted successfully');
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
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <p className="text-sm text-gray-400">Upload files to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
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
                          {document.uploadedBy.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                          }
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">
                        {document.uploadedBy.name}
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
                        onClick={() => handleDelete(document.id)}
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