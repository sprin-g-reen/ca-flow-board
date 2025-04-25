
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { PlusSquare, Search } from 'lucide-react';
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
import { FormDialog } from '@/components/shared/FormDialog';
import { AddClientForm } from '@/components/forms/AddClientForm';
import { toggleModal } from '@/store/slices/uiSlice';

const OwnerClients = () => {
  const dispatch = useDispatch();
  const { modals } = useSelector((state: RootState) => state.ui);
  
  // In a real app, this would come from the API
  const clients = [
    { id: 101, name: 'ABC Corp', contactPerson: 'John Smith', email: 'john@abccorp.com', phone: '+91 98765 43210', status: 'active' },
    { id: 102, name: 'XYZ Industries', contactPerson: 'Sarah Johnson', email: 'sarah@xyzind.com', phone: '+91 87654 32109', status: 'active' },
    { id: 103, name: 'Smith & Co.', contactPerson: 'Robert Smith', email: 'robert@smithco.com', phone: '+91 76543 21098', status: 'active' },
    { id: 104, name: 'Johnson LLC', contactPerson: 'Michael Johnson', email: 'michael@johnsonllc.com', phone: '+91 65432 10987', status: 'inactive' },
    { id: 105, name: 'Patel Enterprises', contactPerson: 'Amit Patel', email: 'amit@patelent.com', phone: '+91 54321 09876', status: 'active' },
  ];

  const handleOpenAddClientModal = () => {
    dispatch(toggleModal({ modal: 'addClient', value: true }));
  };
  
  const handleCloseAddClientModal = () => {
    dispatch(toggleModal({ modal: 'addClient', value: false }));
  };

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
              <Input placeholder="Search clients" className="pl-8" />
            </div>
            <Button 
              className="bg-ca-blue hover:bg-ca-blue-dark"
              onClick={handleOpenAddClientModal}
            >
              <PlusSquare className="mr-2 h-4 w-4" />
              Add New Client
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contactPerson}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <FormDialog
            open={modals.addClient}
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
