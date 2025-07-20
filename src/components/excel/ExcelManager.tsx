import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelManagerProps {
  entityType: 'tasks' | 'clients' | 'employees' | 'invoices';
  data?: any[];
  onImport?: (data: any[]) => void;
  maxSizeLimit?: number; // in MB
}

export const ExcelManager = ({ 
  entityType, 
  data = [], 
  onImport,
  maxSizeLimit = 50 
}: ExcelManagerProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: number;
    warnings: string[];
  } | null>(null);

  const getEntityHeaders = (type: string) => {
    switch (type) {
      case 'tasks':
        return [
          'ID', 'Title', 'Description', 'Status', 'Priority', 'Category',
          'Client Name', 'Assigned To', 'Due Date', 'Created At', 'Updated At'
        ];
      case 'clients':
        return [
          'ID', 'Name', 'Email', 'Phone', 'Address', 'Contact Person',
          'GST Number', 'PAN Number', 'Business Type', 'Industry', 'Status'
        ];
      case 'employees':
        return [
          'ID', 'Employee ID', 'Name', 'Email', 'Department', 'Position',
          'Salary', 'Hire Date', 'Status'
        ];
      case 'invoices':
        return [
          'ID', 'Invoice Number', 'Client Name', 'Amount', 'Tax Amount',
          'Total Amount', 'Status', 'Issue Date', 'Due Date', 'Paid Date'
        ];
      default:
        return [];
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const headers = getEntityHeaders(entityType);
      const worksheetData = [headers, ...data.map(item => 
        headers.map(header => {
          const key = header.toLowerCase().replace(/\s+/g, '_');
          return item[key] || '';
        })
      )];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, entityType.charAt(0).toUpperCase() + entityType.slice(1));
      
      const fileName = `${entityType}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Export Successful",
        description: `${entityType} data exported to ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const validateFileSize = (file: File): boolean => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeLimit) {
      toast({
        title: "File Too Large",
        description: `File size exceeds ${maxSizeLimit}MB limit. Current size: ${fileSizeMB.toFixed(2)}MB`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateData = (data: any[]): { valid: any[]; errors: string[] } => {
    const valid: any[] = [];
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
      
      switch (entityType) {
        case 'tasks':
          if (!row.title || !row.category) {
            errors.push(`Row ${rowNumber}: Title and Category are required`);
          } else {
            valid.push(row);
          }
          break;
        case 'clients':
          if (!row.name || !row.email) {
            errors.push(`Row ${rowNumber}: Name and Email are required`);
          } else {
            valid.push(row);
          }
          break;
        case 'employees':
          if (!row.name || !row.email || !row.employee_id) {
            errors.push(`Row ${rowNumber}: Name, Email, and Employee ID are required`);
          } else {
            valid.push(row);
          }
          break;
        case 'invoices':
          if (!row.invoice_number || !row.amount) {
            errors.push(`Row ${rowNumber}: Invoice Number and Amount are required`);
          } else {
            valid.push(row);
          }
          break;
        default:
          valid.push(row);
      }
    });
    
    return { valid, errors };
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFileSize(file)) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          setImportProgress(25);

          // Convert headers to lowercase with underscores
          const normalizedData = jsonData.map((row: any) => {
            const normalized: any = {};
            Object.keys(row).forEach(key => {
              const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
              normalized[normalizedKey] = row[key];
            });
            return normalized;
          });

          setImportProgress(50);

          // Validate data
          const { valid, errors } = validateData(normalizedData);
          
          setImportProgress(75);

          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 500));

          const result = {
            success: valid.length,
            errors: errors.length,
            warnings: errors
          };

          setImportResult(result);
          setImportProgress(100);

          if (valid.length > 0 && onImport) {
            onImport(valid);
          }

          toast({
            title: result.errors === 0 ? "Import Successful" : "Import Completed with Errors",
            description: `${result.success} records imported successfully. ${result.errors} errors found.`,
            variant: result.errors === 0 ? "default" : "destructive",
          });

        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Failed to process Excel file. Please check the format.",
            variant: "destructive",
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred while importing the file.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const headers = getEntityHeaders(entityType);
    const sampleData = [headers];
    
    // Add sample row based on entity type
    switch (entityType) {
      case 'tasks':
        sampleData.push(['', 'Sample Task', 'Task description', 'todo', 'medium', 'GST', 'Client Name', '', '', '', '']);
        break;
      case 'clients':
        sampleData.push(['', 'ABC Company', 'contact@abc.com', '+91 9876543210', '123 Business Street', 'John Doe', '27ABCDE1234F1Z5', 'ABCDE1234F', 'Private Limited', 'Technology', 'active']);
        break;
      case 'employees':
        sampleData.push(['', 'EMP001', 'John Smith', 'john@company.com', 'Accounts', 'Senior Accountant', '50000', '2024-01-15', 'active']);
        break;
      case 'invoices':
        sampleData.push(['', 'INV-2024-001', 'ABC Company', '10000', '1800', '11800', 'paid', '2024-01-15', '2024-02-15', '2024-02-10']);
        break;
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    XLSX.writeFile(workbook, `${entityType}_import_template.xlsx`);
    
    toast({
      title: "Template Downloaded",
      description: `Import template for ${entityType} has been downloaded.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Excel Import/Export Manager
            <Badge variant="outline">{entityType.charAt(0).toUpperCase() + entityType.slice(1)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-muted-foreground">
                  Export current {entityType} data to Excel format
                </p>
              </div>
              <Button 
                onClick={handleExport}
                disabled={isExporting || data.length === 0}
                variant="outline"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </>
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Records available for export: {data.length}
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Import Data</h4>
                <p className="text-sm text-muted-foreground">
                  Import {entityType} data from Excel file (max {maxSizeLimit}MB)
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={downloadTemplate}
                  variant="ghost"
                  size="sm"
                >
                  Download Template
                </Button>
                <Button 
                  onClick={handleFileSelect}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import from Excel
                    </>
                  )}
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
            />

            {/* Import Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      {importResult.success} records imported successfully
                    </span>
                  </div>
                  {importResult.errors > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">
                        {importResult.errors} errors found
                      </span>
                    </div>
                  )}
                </div>

                {importResult.warnings.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h5 className="font-medium text-yellow-800 mb-2">Import Warnings:</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {importResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};