
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { FileText, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
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
import {
  Badge
} from "@/components/ui/badge";
import { FormDialog } from '@/components/shared/FormDialog';
import { AddInvoiceForm } from '@/components/forms/AddInvoiceForm';
import { toggleModal } from '@/store/slices/uiSlice';

const OwnerInvoices = () => {
  const dispatch = useDispatch();
  const { invoices } = useSelector((state: RootState) => state.invoices);
  const { modals } = useSelector((state: RootState) => state.ui);

  const handleOpenAddInvoiceModal = () => {
    dispatch(toggleModal({ modal: 'addInvoice', value: true }));
  };
  
  const handleCloseAddInvoiceModal = () => {
    dispatch(toggleModal({ modal: 'addInvoice', value: false }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 hover:bg-green-200 text-green-800 hover:text-green-900">Paid</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-800 hover:text-blue-900">Sent</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 hover:text-gray-900">Draft</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 hover:bg-red-200 text-red-800 hover:text-red-900">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Invoices</CardTitle>
          <CardDescription>
            Manage and track client invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices" className="pl-8" />
            </div>
            <Button 
              className="bg-ca-blue hover:bg-ca-blue-dark"
              onClick={handleOpenAddInvoiceModal}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>₹{invoice.total.toLocaleString()}</TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <FormDialog
            open={modals.addInvoice}
            onOpenChange={handleCloseAddInvoiceModal}
            title="Create New Invoice"
            description="Generate an invoice for your client"
            showFooter={false}
          >
            <AddInvoiceForm onSuccess={handleCloseAddInvoiceModal} />
          </FormDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerInvoices;
