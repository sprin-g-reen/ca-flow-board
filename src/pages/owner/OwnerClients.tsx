
import { useState } from 'react';
import { Search, Plus, Download, Upload, Eye, Edit, Trash2 } from 'lucide-react';
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
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';

const OwnerClients = () => {
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { clients, isLoading, error, deleteClient } = useClients();

  const handleOpenAddClientModal = () => {
    setShowAddClient(true);
  };
  
  const handleCloseAddClientModal = () => {
    setShowAddClient(false);
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(clientId);
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
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Client Management</CardTitle>
          <CardDescription>
            Manage your firm's clients with comprehensive information and communication tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-96">
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
                disabled
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Code</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Business Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{client.client_code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.contact_person || 'N/A'}</TableCell>
                      <TableCell>{client.email || 'No email'}</TableCell>
                      <TableCell>{client.phone || 'No phone'}</TableCell>
                      <TableCell>{client.business_type || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            client.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.gst_number ? (
                          <Badge className="bg-blue-100 text-blue-800">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewClient(client)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClient(client.id)}
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

          {selectedClient && (
            <ClientDetailView
              client={selectedClient}
              onClose={() => setSelectedClient(null)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerClients;
