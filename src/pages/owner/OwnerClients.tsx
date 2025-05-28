
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { PlusSquare, Search, Download, Upload, Eye, Edit, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormDialog } from '@/components/shared/FormDialog';
import { AddClientForm } from '@/components/forms/AddClientForm';
import { toggleModal } from '@/store/slices/uiSlice';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

const OwnerClients = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { modals } = useSelector((state: RootState) => state.ui);
  const { clients, isLoading, error, addClient, isAdding } = useClients();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Filter clients based on search query
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  const handleOpenAddClientModal = () => {
    dispatch(toggleModal({ modal: 'addClient', value: true }));
  };
  
  const handleCloseAddClientModal = () => {
    dispatch(toggleModal({ modal: 'addClient', value: false }));
  };

  const handleAddClientSuccess = () => {
    handleCloseAddClientModal();
    toast({
      title: "Success",
      description: "Client added successfully!",
    });
  };

  const handleExportToExcel = () => {
    // Convert clients data to CSV format
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredClients.map(client => [
        `"${client.name}"`,
        `"${client.email || ''}"`,
        `"${client.phone || ''}"`,
        `"${client.address || ''}"`,
        `"${new Date(client.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Clients data exported successfully!",
    });
  };

  const handleImportFromExcel = () => {
    toast({
      title: "Import Feature",
      description: "Import functionality will be available soon!",
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading clients</p>
          <p className="text-sm text-gray-500">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-ca-blue-dark">
                Client Management
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
                Manage your firm's clients and their information
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleExportToExcel}
                className="w-full sm:w-auto"
                disabled={filteredClients.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button 
                variant="outline" 
                onClick={handleImportFromExcel}
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients by name, email, or phone..." 
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="bg-ca-blue hover:bg-ca-blue-dark text-white w-full sm:w-auto"
              onClick={handleOpenAddClientModal}
              disabled={isAdding}
            >
              <PlusSquare className="mr-2 h-4 w-4" />
              {isAdding ? 'Adding...' : 'Add New Client'}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">{clients.length}</p>
                  <p className="text-sm text-blue-600">Total Clients</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">{filteredClients.length}</p>
                  <p className="text-sm text-green-600">Filtered Results</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {clients.filter(c => c.email).length}
                  </p>
                  <p className="text-sm text-purple-600">With Email</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-700">
                    {clients.filter(c => c.phone).length}
                  </p>
                  <p className="text-sm text-orange-600">With Phone</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ca-blue"></div>
              <span className="ml-2 text-gray-600">Loading clients...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PlusSquare className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  {searchQuery 
                    ? 'Try adjusting your search terms or clear the search to see all clients.'
                    : 'Get started by adding your first client to the system.'
                  }
                </p>
                {!searchQuery && (
                  <Button 
                    className="mt-4 bg-ca-blue hover:bg-ca-blue-dark"
                    onClick={handleOpenAddClientModal}
                  >
                    <PlusSquare className="mr-2 h-4 w-4" />
                    Add First Client
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border overflow-hidden bg-white shadow-sm">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4 p-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">{client.name}</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        {client.email && (
                          <p className="text-gray-600">
                            <span className="font-medium">Email:</span> {client.email}
                          </p>
                        )}
                        {client.phone && (
                          <p className="text-gray-600">
                            <span className="font-medium">Phone:</span> {client.phone}
                          </p>
                        )}
                        {client.address && (
                          <p className="text-gray-600">
                            <span className="font-medium">Address:</span> {client.address}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs">
                          Added: {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Client Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Address</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-900">
                          {client.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {client.email || (
                            <span className="text-gray-400 italic">No email</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {client.phone || (
                            <span className="text-gray-400 italic">No phone</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-xs truncate">
                          {client.address || (
                            <span className="text-gray-400 italic">No address</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(client.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <FormDialog
            open={modals.addClient}
            onOpenChange={handleCloseAddClientModal}
            title="Add New Client"
            description="Create a new client record for your firm"
            showFooter={false}
          >
            <AddClientForm onSuccess={handleAddClientSuccess} />
          </FormDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerClients;
