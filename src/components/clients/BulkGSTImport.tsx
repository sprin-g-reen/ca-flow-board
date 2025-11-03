import React, { useState } from 'react';
import { Trash2, Download, ChevronLeft, ChevronRight, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { clientsAPI } from '@/services/api';

interface BulkGSTImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (clients: Array<Record<string, unknown>>) => void;
}

interface GSTClient {
  id: string;
  gst_number: string;
  name: string;
  status: 'checking' | 'valid' | 'duplicate' | 'invalid' | 'error';
  error?: string;
  businessType?: string;
  registrationDate?: string;
  address?: string;
  status_detail?: string;
  existingClient?: {
    id: string;
    name: string;
    email?: string;
  };
}

interface ImportResult {
  successful: Array<{
    id: string;
    name: string;
    gstNumber: string;
    email?: string;
  }>;
  failed: Array<{
    data: any;
    error: string;
  }>;
  duplicates: Array<{
    data: any;
    reason: string;
    existing: {
      id: string;
      name: string;
      gstNumber?: string;
      email?: string;
    };
  }>;
}

export const BulkGSTImport: React.FC<BulkGSTImportProps> = ({ isOpen, onClose, onImport }) => {
  const [gstInput, setGstInput] = useState('');
  const [clients, setClients] = useState<GSTClient[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const isValidGST = (gst: string): boolean => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
  };

  const extractGSTNumbers = (text: string): string[] => {
    // Clean the input and split by multiple delimiters
    const cleanText = text
      .trim()
      .replace(/[,;\s\n\r\t]+/g, ' ') // Replace commas, semicolons, spaces, newlines with single space
      .split(' ')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    const gstNumbers: string[] = [];
    
    cleanText.forEach(item => {
      // Extract GST number from text (handles cases like "Company Name - 27AAAAA0000A1Z5")
      const gstMatch = item.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/);
      if (gstMatch) {
        gstNumbers.push(gstMatch[0]);
      } else if (isValidGST(item)) {
        gstNumbers.push(item);
      }
    });
    
    // Remove duplicates and return
    return [...new Set(gstNumbers)];
  };

  const fetchGSTDetails = async (gstNumber: string): Promise<{ 
    name: string; 
    status: GSTClient['status']; 
    error?: string; 
    existingClient?: any;
    businessType?: string;
    registrationDate?: string;
    address?: string;
    status_detail?: string;
  }> => {
    try {
      // First check if GST number is valid format
      if (!isValidGST(gstNumber)) {
        return { 
          name: 'Invalid GST Format', 
          status: 'invalid',
          error: 'GST number must be 15 characters in format: 27AAAAA0000A1Z5'
        };
      }

      // Call the GST lookup API
      const response = await clientsAPI.lookupGST(gstNumber.toUpperCase()) as any;

      if (response.success && response.data) {
        // GST data found and no duplicate
        const companyData = response.data;
        
        // Extract company name from various possible fields
        const companyName = companyData.legalName || 
                          companyData.tradeName || 
                          companyData.company_name || 
                          companyData.name ||
                          companyData.lgnm || 
                          companyData.tradeNam ||
                          'Unknown Company';

        return {
          name: companyName,
          status: 'valid',
          businessType: companyData.businessType || companyData.ctb || 'Private Limited',
          registrationDate: companyData.registrationDate || companyData.rgdt,
          address: companyData.address || companyData.pradr?.adr,
          status_detail: companyData.status || companyData.sts || 'Active'
        };
      } else if (response.message?.includes('already exists') || response.message?.includes('duplicate')) {
        // Duplicate found
        return {
          name: response.data?.name || response.existing?.name || 'Existing Client',
          status: 'duplicate',
          existingClient: response.data || response.existing
        };
      } else {
        return {
          name: 'GST Lookup Failed',
          status: 'error',
          error: response.message || 'Unable to fetch company details from GST database'
        };
      }
    } catch (error: any) {
      console.error(`Failed to fetch GST details for ${gstNumber}:`, error);
      
      // If it's a 409 conflict (duplicate), handle appropriately
      if (error.response?.status === 409) {
        const existingData = error.response.data?.data || error.response.data?.existing;
        return {
          name: existingData?.name || 'Existing Client',
          status: 'duplicate',
          existingClient: existingData
        };
      }
      
      // Handle other specific HTTP errors
      if (error.response?.status === 404) {
        return {
          name: 'Company Not Found',
          status: 'error',
          error: 'GST number not found in government database'
        };
      }
      
      if (error.response?.status === 429) {
        return {
          name: 'Rate Limited',
          status: 'error',
          error: 'Too many requests. Please wait a moment and try again'
        };
      }
      
      return {
        name: 'Network Error',
        status: 'error',
        error: error.message || 'Failed to connect to GST verification service'
      };
    }
  };

  const handleProcessGST = async () => {
    if (!gstInput.trim()) {
      toast.error('Please enter GST numbers');
      return;
    }

    setIsProcessing(true);
    const gstNumbers = extractGSTNumbers(gstInput);
    
    if (gstNumbers.length === 0) {
      toast.error('No valid GST numbers found');
      setIsProcessing(false);
      return;
    }

    const newClients: GSTClient[] = [];
    
    for (const gst of gstNumbers) {
      try {
        const { name, status, error, existingClient, businessType, registrationDate, address, status_detail } = await fetchGSTDetails(gst);
        newClients.push({
          id: `${gst}-${Date.now()}-${Math.random()}`,
          gst_number: gst,
          name,
          status,
          error,
          existingClient,
          businessType,
          registrationDate,
          address,
          status_detail
        });
      } catch (error) {
        console.error(`Failed to fetch details for GST: ${gst}`, error);
        newClients.push({
          id: `${gst}-${Date.now()}-${Math.random()}`,
          gst_number: gst,
          name: 'Error Fetching Data',
          status: 'error',
          error: 'Failed to fetch GST details'
        });
      }
    }

    setClients(newClients);
    setCurrentIndex(0);
    setIsProcessing(false);
    
    const validCount = newClients.filter(c => c.status === 'valid').length;
    const duplicateCount = newClients.filter(c => c.status === 'duplicate').length;
    const errorCount = newClients.filter(c => c.status === 'error' || c.status === 'invalid').length;
    
    toast.success(`Processed ${newClients.length} GST numbers: ${validCount} valid, ${duplicateCount} duplicates, ${errorCount} errors`);
  };

  const handleRemoveClient = (id: string) => {
    const newClients = clients.filter(client => client.id !== id);
    setClients(newClients);
    
    if (currentIndex >= newClients.length && newClients.length > 0) {
      setCurrentIndex(newClients.length - 1);
    } else if (newClients.length === 0) {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : clients.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev < clients.length - 1 ? prev + 1 : 0);
  };

  const handleImportClients = async () => {
    const validClients = clients.filter(client => client.status === 'valid');
    
    if (validClients.length === 0) {
      toast.error('No valid clients to import');
      return;
    }

    const clientsData = validClients.map(client => ({
      name: client.name,
      gst_number: client.gst_number,
      status: 'Active'
    }));

    if (onImport) {
      onImport(clientsData);
    } else {
      toast.success(`Prepared ${validClients.length} clients for import`);
    }
    
    onClose();
  };

  const handleDownloadReport = () => {
    const csvContent = [
      'GST Number,Company Name,Status,Error',
      ...clients.map(client => 
        `${client.gst_number},${client.name},${client.status},${client.error || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gst-import-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  const currentClient = clients[currentIndex];
  const validCount = clients.filter(c => c.status === 'valid').length;
  const duplicateCount = clients.filter(c => c.status === 'duplicate').length;
  const errorCount = clients.filter(c => c.status === 'error' || c.status === 'invalid').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Bulk GST Import</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Enter multiple GST numbers to automatically fetch company details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="gst-input" className="text-sm font-medium text-gray-900">GST Numbers</Label>
                <p className="text-xs text-gray-500 mt-1">Paste multiple GST numbers separated by commas, spaces, or new lines</p>
              </div>
              <textarea
                id="gst-input"
                value={gstInput}
                onChange={(e) => setGstInput(e.target.value)}
                placeholder="27AAAAA0000A1Z5, 29BBBBB1111B2Z6, 24CCCCC2222C3Z7
Paste your GST numbers here - any format works!"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm placeholder:text-gray-400"
                disabled={isProcessing}
              />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Comma separated</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Space separated</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Line separated</span>
                </div>
              </div>
              <Button 
                onClick={handleProcessGST} 
                disabled={isProcessing || !gstInput.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 h-11"
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Process GST Numbers
                  </>
                )}
              </Button>
            </div>

            {/* Results Section */}
            {clients.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {validCount} Valid
                    </Badge>
                    {duplicateCount > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {duplicateCount} Duplicates
                      </Badge>
                    )}
                    {errorCount > 0 && (
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errorCount} Errors
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentIndex + 1} of {clients.length}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-3 py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={clients.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex gap-1.5">
                    {clients.slice(0, 5).map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                          index === currentIndex ? 'bg-purple-500' : 'bg-gray-300'
                        }`}
                        onClick={() => setCurrentIndex(index)}
                      />
                    ))}
                    {clients.length > 5 && <span className="text-xs text-gray-400 ml-1">...</span>}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={clients.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current Client */}
                {currentClient && (
                  <Card className={`transition-colors ${
                    currentClient.status === 'valid' ? 'border-green-200 bg-green-50' :
                    currentClient.status === 'duplicate' ? 'border-red-200 bg-red-50' :
                    currentClient.status === 'error' || currentClient.status === 'invalid' ? 'border-orange-200 bg-orange-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-lg text-gray-900">{currentClient.name}</h4>
                            <Badge 
                              variant={
                                currentClient.status === 'valid' ? "secondary" :
                                currentClient.status === 'duplicate' ? "destructive" :
                                "outline"
                              }
                              className={`text-sm px-3 py-1 ${
                                currentClient.status === 'valid' ? 'bg-green-100 text-green-800' :
                                currentClient.status === 'duplicate' ? 'bg-red-100 text-red-800' :
                                currentClient.status === 'error' || currentClient.status === 'invalid' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                                ''
                              }`}
                            >
                              {currentClient.status === 'valid' ? 'Valid Company' :
                               currentClient.status === 'duplicate' ? 'Already Exists' :
                               currentClient.status === 'invalid' ? 'Invalid GST Format' :
                               currentClient.status === 'error' ? 'Lookup Failed' :
                               'Checking...'}
                            </Badge>
                          </div>
                          
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">GST Number</p>
                            <p className="text-base font-mono text-gray-900 tracking-wider">
                              {currentClient.gst_number}
                            </p>
                          </div>

                          {currentClient.status === 'valid' && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-700">Registration Status</span>
                                </div>
                                <p className="text-sm text-green-600 font-medium">
                                  {currentClient.status_detail || 'Active & Verified'}
                                </p>
                              </div>
                              
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-700">Business Type</span>
                                </div>
                                <p className="text-sm text-blue-600 font-medium">
                                  {currentClient.businessType || 'Private Limited'}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {currentClient.status === 'valid' && currentClient.address && (
                            <div className="bg-white rounded-lg p-3 border border-gray-200 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-gray-700">Registered Address</span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {currentClient.address}
                              </p>
                            </div>
                          )}
                          
                          {currentClient.error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-700">Error Details</span>
                              </div>
                              <p className="text-sm text-red-600">
                                {currentClient.error}
                              </p>
                            </div>
                          )}
                          
                          {currentClient.existingClient && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-700">Duplicate Found</span>
                              </div>
                              <p className="text-sm text-orange-600">
                                This GST number is already registered under: <span className="font-medium">{currentClient.existingClient.name}</span>
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClient(currentClient.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0 ml-4 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="px-4 py-2">
                Cancel
              </Button>
              {clients.length > 0 && (
                <Button variant="outline" onClick={handleDownloadReport} className="px-4 py-2">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              )}
            </div>
            {validCount > 0 && (
              <Button onClick={handleImportClients} className="bg-green-600 hover:bg-green-700 px-4 py-2">
                Import {validCount} Clients
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};