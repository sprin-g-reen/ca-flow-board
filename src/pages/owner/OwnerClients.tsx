
import { useState } from 'react';
import { Search, Plus, Download, Upload, Eye, Edit, Trash2, Trash, Archive, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormDialog } from '@/components/shared/FormDialog';
import { AddClientForm } from '@/components/forms/AddClientForm';
import { ClientDetailView } from '@/components/clients/ClientDetailView';
import { BulkGSTImport } from '@/components/clients/BulkGSTImport';
import { BulkCINImport } from '@/components/clients/BulkCINImport';
import { ImportOptionsModal } from '@/components/clients/ImportOptionsModal';
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';

const OwnerClients = () => {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkGSTImport, setShowBulkGSTImport] = useState(false);
  const [showBulkCINImport, setShowBulkCINImport] = useState(false);
  const [showImportOptions, setShowImportOptions] = useState(false);
  
  // Bulk selection state
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  
  const { 
    clients, 
    isLoading, 
    error, 
    deleteClient, 
    bulkImportClients, 
    bulkDeleteClients,
    bulkUpdateClientStatus,
    bulkArchiveClients,
    isImporting,
    isBulkDeleting,
    isBulkUpdatingStatus,
    isBulkArchiving
  } = useClients();

  const handleOpenAddClientModal = () => {
    setShowAddClient(true);
  };
  
  const handleCloseAddClientModal = () => {
    setShowAddClient(false);
  };

  // Bulk selection handlers
  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(filteredClients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedClients.length === 0) {
      toast.error('Please select clients first');
      return;
    }

    const selectedCount = selectedClients.length;
    let confirmTitle = '';
    let confirmText = '';
    let confirmAction = '';

    switch (action) {
      case 'delete':
        confirmTitle = 'Delete Clients';
        confirmText = `Are you sure you want to delete ${selectedCount} selected clients? This action cannot be undone.`;
        confirmAction = 'Yes, Delete';
        break;
      case 'activate':
        confirmTitle = 'Activate Clients';
        confirmText = `Set ${selectedCount} selected clients to Active status?`;
        confirmAction = 'Yes, Activate';
        break;
      case 'deactivate':
        confirmTitle = 'Deactivate Clients';
        confirmText = `Set ${selectedCount} selected clients to Inactive status?`;
        confirmAction = 'Yes, Deactivate';
        break;
      case 'archive':
        confirmTitle = 'Archive Clients';
        confirmText = `Archive ${selectedCount} selected clients?`;
        confirmAction = 'Yes, Archive';
        break;
      default:
        return;
    }

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'delete' ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmAction,
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        switch (action) {
          case 'delete':
            await bulkDeleteClients(selectedClients);
            break;
          case 'activate':
            await bulkUpdateClientStatus({ clientIds: selectedClients, status: 'active' });
            break;
          case 'deactivate':
            await bulkUpdateClientStatus({ clientIds: selectedClients, status: 'inactive' });
            break;
          case 'archive':
            await bulkArchiveClients({ clientIds: selectedClients, archived: true });
            break;
        }
        setSelectedClients([]);
        setBulkAction('');
      } catch (error) {
        console.error('Bulk action error:', error);
      }
    }
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowEditClient(true);
  };

  const handleCloseEditClientModal = () => {
    setShowEditClient(false);
    setEditingClient(null);
  };

  const handleDeleteClient = async (client) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${client.name}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        deleteClient(client.id);
        Swal.fire({
          title: 'Deleted!',
          text: `${client.name} has been deleted successfully.`,
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete the client. Please try again.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  const handleExportClients = () => {
    try {
      const exportData = clients.map(client => ({
        client_code: client.client_code || '',
        name: client.name,
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        business_type: client.business_type || '',
        industry: client.industry || '',
        gst_number: client.gst_number || '',
        pan_number: client.pan_number || '',
        address: client.address || '',
        status: client.status || '',
        payment_terms: client.payment_terms || '',
        credit_limit: client.credit_limit || '',
        created_at: client.created_at,
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Clients exported successfully');
    } catch (error) {
      toast.error('Failed to export clients');
    }
  };

  const handleImportClients = async () => {
    setShowImportOptions(true);
  };

  const handleUploadExcel = () => {
    setShowImportOptions(false);
    // Upload Excel file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => handleExcelUpload(e as any);
    input.click();
  };

  const downloadExcelTemplate = () => {
    const templateData = [{
      client_code: 'CLI001',
      name: 'Sample Client Name',
      contact_person: 'Contact Person',
      email: 'client@company.com',
      phone: '+91 0000000000',
      business_type: 'Private Limited',
      industry: 'Technology',
      gst_number: '22AAAAA0000A1Z5',
      pan_number: 'AAAAA0000A',
      address: '123 Business Street, City, State - 400001',
      status: 'Active',
      payment_terms: '30 days',
      credit_limit: '100000'
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients Template');
    
    // Auto-size columns
    const cols = Object.keys(templateData[0]).map(() => ({ width: 20 }));
    worksheet['!cols'] = cols;
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `clients-import-template-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success('Excel template downloaded successfully');
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, any>>;

      if (jsonData.length === 0) {
        toast.error('Excel file is empty');
        return;
      }

      // Validate and process the data
      const validClients: any[] = [];
      const errors: string[] = [];

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // Excel row number (accounting for header)
        
        if (!row.name) {
          errors.push(`Row ${rowNumber}: Client name is required`);
          return;
        }

        if (row.email && !isValidEmail(row.email)) {
          errors.push(`Row ${rowNumber}: Invalid email format`);
          return;
        }

        if (row.gst_number && !isValidGST(row.gst_number)) {
          errors.push(`Row ${rowNumber}: Invalid GST number format`);
          return;
        }

        validClients.push({
          client_code: row.client_code || '',
          name: row.name,
          contact_person: row.contact_person || '',
          email: row.email || '',
          phone: row.phone || '',
          business_type: row.business_type || '',
          industry: row.industry || '',
          gst_number: row.gst_number || '',
          pan_number: row.pan_number || '',
          address: row.address || '',
          status: row.status || 'Active',
          payment_terms: row.payment_terms || '',
          credit_limit: row.credit_limit || ''
        });
      });

      if (errors.length > 0) {
        Swal.fire({
          title: 'Validation Errors',
          html: `<div class="text-left"><ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul></div>`,
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      // Confirm import
      const confirmResult = await Swal.fire({
        title: 'Confirm Import',
        text: `Ready to import ${validClients.length} clients. Continue?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Import',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280'
      });

      if (confirmResult.isConfirmed) {
        bulkImportClients(validClients);
      }

    } catch (error) {
      toast.error('Failed to process Excel file');
      console.error('Excel upload error:', error);
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidGST = (gst) => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ca-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Error loading clients. Please try again.</p>
      </div>
    );
  }

  // Filter clients based on search query
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.business_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const totalClients = clients.length;
  const activeClients = clients.filter(client => client.status === 'active').length;
  const clientsWithGST = clients.filter(client => client.gst_number).length;
  const filteredResults = filteredClients.length;

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Client Management</CardTitle>
          <CardDescription>
            Manage your firm's clients with comprehensive information and communication tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-hidden">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div className="relative flex-1 min-w-[300px] max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients by name, code, email, phone, or business type..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleExportClients}
                disabled={clients.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button 
                variant="outline"
                onClick={handleImportClients}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button 
                className="bg-ca-blue hover:bg-ca-blue-dark"
                onClick={handleOpenAddClientModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          {selectedClients.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-blue-800 font-medium">
                  {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Choose action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activate">Set Active</SelectItem>
                      <SelectItem value="deactivate">Set Inactive</SelectItem>
                      <SelectItem value="archive">Archive</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => handleBulkAction(bulkAction)}
                    disabled={!bulkAction || isBulkDeleting || isBulkUpdatingStatus || isBulkArchiving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {(isBulkDeleting || isBulkUpdatingStatus || isBulkArchiving) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Apply
                  </Button>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedClients([]);
                  setBulkAction('');
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Selection
              </Button>
            </div>
          )}

          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
                <div className="text-sm text-blue-600">Total Clients</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{activeClients}</div>
                <div className="text-sm text-green-600">Active Clients</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{clientsWithGST}</div>
                <div className="text-sm text-purple-600">With GST Number</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{filteredResults}</div>
                <div className="text-sm text-orange-600">Search Results</div>
              </CardContent>
            </Card>
          </div>

          {filteredClients.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  {searchQuery 
                    ? 'Try adjusting your search terms to find clients.'
                    : 'Get started by adding your first client to the system.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="w-full overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[3%] min-w-[50px]">
                        <Checkbox
                          checked={
                            filteredClients.length > 0 && 
                            selectedClients.length === filteredClients.length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all clients"
                        />
                      </TableHead>
                      <TableHead className="w-[8%] min-w-[80px]">Code</TableHead>
                      <TableHead className="w-[15%] min-w-[120px]">Company Name</TableHead>
                      <TableHead className="w-[12%] min-w-[100px]">Contact Person</TableHead>
                      <TableHead className="w-[15%] min-w-[120px]">Email</TableHead>
                      <TableHead className="w-[10%] min-w-[100px]">Phone</TableHead>
                      <TableHead className="w-[12%] min-w-[100px]">Business Type</TableHead>
                      <TableHead className="w-[8%] min-w-[80px]">Status</TableHead>
                      <TableHead className="w-[7%] min-w-[60px]">GST</TableHead>
                      <TableHead className="w-[10%] min-w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                            aria-label={`Select ${client.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{client.client_code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="truncate max-w-[150px]" title={client.name}>
                            {client.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[120px]" title={client.contact_person || 'N/A'}>
                            {client.contact_person || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[150px]" title={client.email || 'No email'}>
                            {client.email || 'No email'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[100px]" title={client.phone || 'No phone'}>
                            {client.phone || 'No phone'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[100px]" title={client.business_type || 'N/A'}>
                            {client.business_type || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              client.status === 'active' 
                                ? 'bg-green-100 text-green-800 text-xs whitespace-nowrap' 
                                : 'bg-red-100 text-red-800 text-xs whitespace-nowrap'
                            }
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.gst_number ? (
                            <Badge className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs whitespace-nowrap">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewClient(client)}
                              title="View Client Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditClient(client)}
                              title="Edit Client"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteClient(client)}
                              title="Delete Client"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <FormDialog
            open={showAddClient}
            onOpenChange={handleCloseAddClientModal}
            title="Add New Client"
            description="Create a comprehensive client record for your firm"
            showFooter={false}
          >
            <AddClientForm onSuccess={handleCloseAddClientModal} />
          </FormDialog>

          <FormDialog
            open={showEditClient}
            onOpenChange={handleCloseEditClientModal}
            title="Edit Client"
            description="Update client information and details"
            showFooter={false}
          >
            {editingClient && (
              <AddClientForm 
                onSuccess={handleCloseEditClientModal}
                initialData={editingClient}
                isEditing={true}
              />
            )}
          </FormDialog>

          {selectedClient && (
            <ClientDetailView
              client={selectedClient}
              onClose={() => setSelectedClient(null)}
            />
          )}

          <BulkGSTImport
            isOpen={showBulkGSTImport}
            onClose={() => setShowBulkGSTImport(false)}
            onImport={bulkImportClients}
          />

          <BulkCINImport
            isOpen={showBulkCINImport}
            onClose={() => setShowBulkCINImport(false)}
            onImport={bulkImportClients}
          />

          <ImportOptionsModal
            isOpen={showImportOptions}
            onClose={() => setShowImportOptions(false)}
            onDownloadTemplate={() => {
              setShowImportOptions(false);
              downloadExcelTemplate();
            }}
            onBulkGSTImport={() => {
              setShowImportOptions(false);
              setShowBulkGSTImport(true);
            }}
            onBulkCINImport={() => {
              setShowImportOptions(false);
              setShowBulkCINImport(true);
            }}
            onUploadExcel={handleUploadExcel}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerClients;
