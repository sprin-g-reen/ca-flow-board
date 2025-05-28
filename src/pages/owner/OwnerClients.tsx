
import { useState } from 'react';
import { Search, Plus, Download, Upload } from 'lucide-react';
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
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';

const OwnerClients = () => {
  const [showAddClient, setShowAddClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { clients, isLoading, error } = useClients();

  const handleOpenAddClientModal = () => {
    setShowAddClient(true);
  };
  
  const handleCloseAddClientModal = () => {
    setShowAddClient(false);
  };

  const handleExportClients = () => {
    try {
      const exportData = clients.map(client => ({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        created_at: client.created_at,
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
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
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const totalClients = clients.length;
  const clientsWithEmail = clients.filter(client => client.email).length;
  const clientsWithPhone = clients.filter(client => client.phone).length;
  const filteredResults = filteredClients.length;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Client Management</CardTitle>
          <CardDescription>
            Manage your firm's clients and their information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients by name, email, or phone..." 
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
                className="bg-ca-blue hover:bg-ca-blue-dark"
                onClick={handleOpenAddClientModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
                <div className="text-sm text-blue-600">Total Clients</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{filteredResults}</div>
                <div className="text-sm text-green-600">Filtered Results</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{clientsWithEmail}</div>
                <div className="text-sm text-purple-600">With Email</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{clientsWithPhone}</div>
                <div className="text-sm text-orange-600">With Phone</div>
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
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email || 'No email'}</TableCell>
                      <TableCell>{client.phone || 'No phone'}</TableCell>
                      <TableCell className="max-w-xs truncate">{client.address || 'No address'}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(client.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
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
            description="Create a new client record for your firm"
            showFooter={false}
          >
            <AddClientForm onSuccess={handleCloseAddClientModal} />
          </FormDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerClients;
