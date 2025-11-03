import React, { useState } from 'react';
import { Trash2, Download, ChevronLeft, ChevronRight, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cinService } from '@/services/cin';
import { clientsAPI } from '@/services/api';

interface BulkCINImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (clients: Array<Record<string, unknown>>) => void;
}

interface CINClient {
  id: string;
  cin_number: string;
  name: string;
  status: 'checking' | 'valid' | 'duplicate' | 'invalid' | 'error';
  error?: string;
  category?: string;
  subCategory?: string;
  classOfCompany?: string;
  dateOfIncorporation?: string;
  registeredOffice?: string;
  companyStatus?: string;
  existingClient?: {
    id: string;
    name: string;
    email?: string;
  };
}

export const BulkCINImport: React.FC<BulkCINImportProps> = ({ isOpen, onClose, onImport }) => {
  const [cinInput, setCinInput] = useState('');
  const [clients, setClients] = useState<CINClient[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const isValidCIN = (cin: string): boolean => {
    return /^[ULF]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(cin.toUpperCase());
  };

  const extractCINNumbers = (text: string): string[] => {
    // Clean the input and split by multiple delimiters
    const cleanText = text
      .trim()
      .replace(/[,;\s\n\r\t]+/g, ' ') // Replace commas, semicolons, spaces, newlines with single space
      .split(' ')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    const cinNumbers: string[] = [];
    
    cleanText.forEach(item => {
      // Extract CIN number from text (handles cases like "Company Name - U17299TZ2022PTC038626")
      const cinMatch = item.match(/[ULF]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/);
      if (cinMatch) {
        cinNumbers.push(cinMatch[0]);
      } else if (isValidCIN(item)) {
        cinNumbers.push(item.toUpperCase());
      }
    });
    
    // Remove duplicates and return
    return [...new Set(cinNumbers)];
  };

  const fetchCINDetails = async (cinNumber: string): Promise<{ 
    name: string; 
    status: CINClient['status']; 
    error?: string; 
    existingClient?: any;
    category?: string;
    subCategory?: string;
    classOfCompany?: string;
    dateOfIncorporation?: string;
    registeredOffice?: string;
    companyStatus?: string;
  }> => {
    try {
      // First check if CIN number is valid format
      if (!isValidCIN(cinNumber)) {
        return { 
          name: 'Invalid CIN Format', 
          status: 'invalid',
          error: 'CIN number must be 21 characters in format: U17299TZ2022PTC038626'
        };
      }

      // Parse CIN to extract basic information
      const cinInfo = cinService.parseCIN(cinNumber);
      if (!cinInfo) {
        return {
          name: 'Invalid CIN Structure',
          status: 'invalid',
          error: 'CIN format is correct but structure is invalid'
        };
      }

      // Use the clientsAPI to lookup CIN details
      const response = await clientsAPI.lookupCIN(cinNumber) as any;
      
      if (response.success && response.data) {
        const companyData = response.data;
        
        // Extract company name from various possible fields
        const companyName = companyData.name || 
                          companyData.legalName || 
                          companyData.company_name ||
                          companyData.displayText ||
                          `Company with CIN: ${cinNumber}`;

        return {
          name: companyName,
          status: 'valid',
          category: companyData.category || (cinInfo.category === 'U' ? 'Unlisted Public Company' : cinInfo.category === 'L' ? 'Listed Public Company' : 'Foreign Company'),
          classOfCompany: companyData.classOfCompany || 'Private',
          dateOfIncorporation: companyData.dateOfIncorporation,
          registeredOffice: companyData.registeredOffice,
          companyStatus: companyData.status || 'Active'
        };
      } else if (response.message?.includes('already exists') || response.message?.includes('duplicate')) {
        // Duplicate found
        return {
          name: response.data?.name || 'Existing Client',
          status: 'duplicate',
          existingClient: response.data
        };
      } else {
        // If API fails, create a basic valid entry based on CIN structure
        return {
          name: `Company with CIN: ${cinNumber}`,
          status: 'valid',
          category: cinInfo.category === 'U' ? 'Unlisted Public Company' : cinInfo.category === 'L' ? 'Listed Public Company' : 'Foreign Company',
          classOfCompany: 'Private',
          companyStatus: 'Active',
          dateOfIncorporation: `${cinInfo.year}-01-01` // Approximate based on CIN year
        };
      }
    } catch (error: any) {
      console.error(`Failed to fetch CIN details for ${cinNumber}:`, error);
      
      // Handle different types of errors
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        return {
          name: 'Existing Client',
          status: 'duplicate',
          existingClient: { id: 'unknown', name: 'Existing Client' }
        };
      }
      
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
          error: 'CIN number not found in company database'
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
        name: 'CIN Lookup Error',
        status: 'error',
        error: error.message || 'Failed to connect to company verification service'
      };
    }
  };

  const handleProcessCIN = async () => {
    if (!cinInput.trim()) {
      toast.error('Please enter CIN numbers');
      return;
    }

    setIsProcessing(true);
    const cinNumbers = extractCINNumbers(cinInput);
    
    if (cinNumbers.length === 0) {
      toast.error('No valid CIN numbers found');
      setIsProcessing(false);
      return;
    }

    const newClients: CINClient[] = [];
    
    for (const cin of cinNumbers) {
      try {
        const { 
          name, 
          status, 
          error, 
          existingClient, 
          category, 
          subCategory, 
          classOfCompany, 
          dateOfIncorporation, 
          registeredOffice, 
          companyStatus 
        } = await fetchCINDetails(cin);
        
        newClients.push({
          id: `${cin}-${Date.now()}-${Math.random()}`,
          cin_number: cin,
          name,
          status,
          error,
          existingClient,
          category,
          subCategory,
          classOfCompany,
          dateOfIncorporation,
          registeredOffice,
          companyStatus
        });
      } catch (error) {
        console.error(`Failed to fetch details for CIN: ${cin}`, error);
        newClients.push({
          id: `${cin}-${Date.now()}-${Math.random()}`,
          cin_number: cin,
          name: 'Error Fetching Data',
          status: 'error',
          error: 'Failed to fetch CIN details'
        });
      }
    }

    setClients(newClients);
    setCurrentIndex(0);
    setIsProcessing(false);
    
    const validCount = newClients.filter(c => c.status === 'valid').length;
    const duplicateCount = newClients.filter(c => c.status === 'duplicate').length;
    const errorCount = newClients.filter(c => c.status === 'error' || c.status === 'invalid').length;
    
    toast.success(`Processed ${newClients.length} CIN numbers: ${validCount} valid, ${duplicateCount} duplicates, ${errorCount} errors`);
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
      cin_number: client.cin_number,
      business_type: client.classOfCompany || 'Private Limited',
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
      'CIN Number,Company Name,Status,Category,Class,Registration Date,Error',
      ...clients.map(client => 
        `${client.cin_number},${client.name},${client.status},${client.category || ''},${client.classOfCompany || ''},${client.dateOfIncorporation || ''},${client.error || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cin-import-report-${new Date().toISOString().split('T')[0]}.csv`;
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
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Bulk CIN Import</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Enter multiple CIN numbers to automatically fetch company details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="cin-input" className="text-sm font-medium text-gray-900">CIN Numbers</Label>
                <p className="text-xs text-gray-500 mt-1">Paste multiple CIN numbers separated by commas, spaces, or new lines</p>
              </div>
              <textarea
                id="cin-input"
                value={cinInput}
                onChange={(e) => setCinInput(e.target.value)}
                placeholder="U17299TZ2022PTC038626, U72900TZ2022PTC038715, U72900TZ2022PTC040031
Paste your CIN numbers here - any format works!"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-gray-400"
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
                onClick={handleProcessCIN} 
                disabled={isProcessing || !cinInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11"
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Building className="h-4 w-4 mr-2" />
                    Process CIN Numbers
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
                          index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
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
                               currentClient.status === 'invalid' ? 'Invalid CIN Format' :
                               currentClient.status === 'error' ? 'Lookup Failed' :
                               'Checking...'}
                            </Badge>
                          </div>
                          
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">CIN Number</p>
                            <p className="text-base font-mono text-gray-900 tracking-wider">
                              {currentClient.cin_number}
                            </p>
                          </div>

                          {currentClient.status === 'valid' && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-700">Company Status</span>
                                </div>
                                <p className="text-sm text-green-600 font-medium">
                                  {currentClient.companyStatus || 'Active'}
                                </p>
                              </div>
                              
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-700">Company Type</span>
                                </div>
                                <p className="text-sm text-blue-600 font-medium">
                                  {currentClient.category || 'Public Company'}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {currentClient.status === 'valid' && currentClient.dateOfIncorporation && (
                            <div className="bg-white rounded-lg p-3 border border-gray-200 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-gray-700">Date of Incorporation</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {currentClient.dateOfIncorporation}
                              </p>
                            </div>
                          )}
                          
                          {currentClient.status === 'valid' && currentClient.registeredOffice && (
                            <div className="bg-white rounded-lg p-3 border border-gray-200 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="h-4 w-4 text-indigo-600" />
                                <span className="text-sm font-medium text-gray-700">Registered Office</span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {currentClient.registeredOffice}
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
                                This CIN number is already registered under: <span className="font-medium">{currentClient.existingClient.name}</span>
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