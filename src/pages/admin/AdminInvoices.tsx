
import { useState, useEffect } from 'react';
import { FileText, Plus, Download, Mail, Eye, Edit, Trash2, Check, X, Calendar, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDialog } from '@/components/shared/FormDialog';
import { EnhancedInvoiceForm } from '@/components/invoices/EnhancedInvoiceForm';
import { InvoicePreviewModal } from '@/components/invoices/InvoicePreviewModal';
import { InvoiceFilterPanel } from '@/components/invoices/InvoiceFilterPanel';
import { useInvoices, useInvoice, useUpdateInvoiceStatus, useDeleteInvoice, useBulkDeleteInvoices, useBulkUpdateInvoiceStatus } from '@/hooks/useInvoices';
import { generateInvoicePDF } from '@/utils/invoicePDF';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

interface InvoiceFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Wrapper component to fetch invoice data and pass to form
const EditInvoiceWrapper = ({ invoiceId, onSuccess }: { invoiceId: string; onSuccess: () => void }) => {
  const { data: invoiceResponse, isLoading } = useInvoice(invoiceId);
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading invoice...</div>;
  }
  
  if (!invoiceResponse?.data) {
    return <div className="p-8 text-center text-red-600">Invoice not found</div>;
  }
  
  const invoice = invoiceResponse.data;
  
  // Transform invoice data to form format
  const initialData: any = {
    _id: invoice._id,
    type: invoice.type,
    client: typeof invoice.client === 'string' ? invoice.client : invoice.client?._id || '',
    issueDate: invoice.issueDate ? new Date(invoice.issueDate) : new Date(),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
    items: invoice.items || [],
    notes: invoice.notes || '',
    discount: invoice.discount || { type: 'percentage', value: 0 },
    paymentTerms: invoice.paymentTerms || '',
    collectionMethod: invoice.collectionMethod || 'account_1',
    bankDetails: invoice.bankDetails || {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    }
  };
  
  return (
    <EnhancedInvoiceForm 
      onSuccess={onSuccess}
      initialData={initialData}
      isEditing={true}
    />
  );
};

const AdminInvoices = () => {
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const { settings: firmSettings } = useSettings({ category: 'company' });
  
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 10;
  
  // Bulk actions state
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  
  // Edit invoice state
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch invoices with filters
  const { 
    data: invoicesResponse, 
    isLoading, 
    error, 
    refetch 
  } = useInvoices({
    search: filters.search,
    status: filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: currentPage,
    limit: pageLimit
  });

  const updateStatusMutation = useUpdateInvoiceStatus();
  const deleteInvoiceMutation = useDeleteInvoice();
  const bulkDeleteMutation = useBulkDeleteInvoices();
  const bulkUpdateStatusMutation = useBulkUpdateInvoiceStatus();

  const handleOpenEditModal = (invoiceId: string) => {
    setEditingInvoiceId(invoiceId);
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setEditingInvoiceId(null);
    setIsEditModalOpen(false);
    refetch(); // Refresh invoice list
  };

  const handleFiltersChange = (newFilters: InvoiceFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setSelectedInvoices([]);
    setIsSelectAllChecked(false);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
    setSelectedInvoices([]);
    setIsSelectAllChecked(false);
  };

  const handleStatusUpdate = async (invoiceId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ 
        invoiceId, 
        status: status as any
      });
      toast.success('Status updated');
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const result = await Swal.fire({
      title: 'Delete invoice?',
      text: 'Are you sure you want to delete this invoice?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await deleteInvoiceMutation.mutateAsync(invoiceId);
      toast.success('Invoice deleted');
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  // Bulk actions handlers
  const handleSelectAll = (checked: boolean) => {
    setIsSelectAllChecked(checked);
    if (checked) {
      setSelectedInvoices(invoices.map(invoice => invoice._id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
      setIsSelectAllChecked(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;
    
    const result = await Swal.fire({ 
      title: 'Confirm delete', 
      text: `Are you sure you want to delete ${selectedInvoices.length} invoice(s)?`, 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'Delete',
      confirmButtonColor: '#d33'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await bulkDeleteMutation.mutateAsync(selectedInvoices);
      setSelectedInvoices([]);
      setIsSelectAllChecked(false);
      toast.success(`${selectedInvoices.length} invoices deleted`);
    } catch (error) {
      console.error('Failed to delete invoices:', error);
      toast.error('Failed to delete invoices');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedInvoices.length === 0) return;

    try {
      await bulkUpdateStatusMutation.mutateAsync({ 
        invoiceIds: selectedInvoices, 
        status 
      });
      setSelectedInvoices([]);
      setIsSelectAllChecked(false);
      toast.success(`Updated ${selectedInvoices.length} invoices to ${status}`);
    } catch (error) {
      console.error('Failed to update invoice statuses:', error);
      toast.error('Failed to update invoice statuses');
    }
  };

  const handleDownloadPDF = (invoice: any) => {
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      client: {
        name: invoice.client?.fullName || invoice.client?.name || 'Client',
        email: invoice.client?.email || '',
        phone: invoice.client?.phone,
        address: invoice.client?.address,
        gst_number: invoice.client?.gst_number,
      },
      items: invoice.items,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      notes: invoice.notes,
      terms: invoice.terms,
    };

    const firmData = {
      name: firmSettings?.name || 'CA Firm',
      address: firmSettings?.address,
      email: firmSettings?.email,
      phone: firmSettings?.phone,
      gstNumber: firmSettings?.gstNumber,
    };

    generateInvoicePDF(pdfData, firmData);
  };

  const clearSelection = () => {
    setSelectedInvoices([]);
    setIsSelectAllChecked(false);
  };

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      paid: "bg-green-100 text-green-800",
      sent: "bg-blue-100 text-blue-800",
      draft: "bg-gray-100 text-gray-800",
      overdue: "bg-red-100 text-red-800",
      partially_paid: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-slate-100 text-slate-800"
    };

    return (
      <Badge className={badgeClasses[status as keyof typeof badgeClasses] || "bg-gray-100 text-gray-800"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const invoices = invoicesResponse?.data || [];
  const pagination = invoicesResponse?.pagination;

  // Preview modal state
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const { data: previewInvoiceResponse } = useInvoice(previewInvoiceId || undefined);
  const previewInvoice = previewInvoiceResponse?.data;

  const computeCalculations = (inv: any) => {
    if (!inv) return { subtotal: 0, discountAmount: 0, taxAmount: 0, total: 0 };
    const subtotal = inv.subtotal || 0;
    const discountAmount = inv.discount?.amount || 0;
    const taxAmount = inv.taxAmount || 0;
    const total = inv.totalAmount || subtotal - discountAmount + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  };

  useEffect(() => {
    if (invoices.length > 0) {
      const allSelected = invoices.every(invoice => selectedInvoices.includes(invoice._id));
      const someSelected = invoices.some(invoice => selectedInvoices.includes(invoice._id));
      setIsSelectAllChecked(allSelected && someSelected);
    }
  }, [invoices, selectedInvoices]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ca-blue-dark">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage client billing and payments</p>
        </div>
        <Button 
          className="bg-ca-blue hover:bg-ca-blue-dark shadow-md transition-all active:scale-95"
          onClick={() => setShowAddInvoice(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {/* Filter Panel */}
          <div className="mb-6">
            <InvoiceFilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedInvoices.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedInvoices.length} selected
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSelection}
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-blue-300">
                      <Check className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('paid')}>Mark as Paid</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('sent')}>Mark as Sent</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('overdue')}>Mark as Overdue</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('cancelled')}>Mark as Cancelled</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ca-blue"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No invoices found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or create a new invoice.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isSelectAllChecked}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
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
                  {invoices.map((invoice: any) => (
                    <TableRow key={invoice._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.includes(invoice._id)}
                          onCheckedChange={(checked) => handleSelectInvoice(invoice._id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{invoice.client?.fullName || invoice.client?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{invoice.client?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>₹{invoice.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setPreviewInvoiceId(invoice._id)} title="View">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(invoice._id)} title="Edit">
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(invoice)} title="Download">
                            <Download className="h-4 w-4 text-purple-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(invoice._id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.total, prev + 1))}
                  disabled={currentPage === pagination.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <FormDialog
        open={showAddInvoice}
        onOpenChange={setShowAddInvoice}
        title="Create New Invoice"
        description="Generate a professional invoice for your client"
        showFooter={false}
        className="max-w-5xl"
      >
        <EnhancedInvoiceForm onSuccess={() => {
          setShowAddInvoice(false);
          refetch();
        }} />
      </FormDialog>

      {editingInvoiceId && (
        <FormDialog
          open={isEditModalOpen}
          onOpenChange={handleCloseEditModal}
          title="Edit Invoice"
          description="Update invoice details"
          showFooter={false}
          className="max-w-5xl"
        >
          <EditInvoiceWrapper 
            invoiceId={editingInvoiceId}
            onSuccess={handleCloseEditModal}
          />
        </FormDialog>
      )}

      <InvoicePreviewModal
        isOpen={!!previewInvoiceId}
        onClose={() => setPreviewInvoiceId(null)}
        invoiceData={previewInvoice}
        calculations={computeCalculations(previewInvoice)}
        isInterState={false}
        clientData={previewInvoice?.client}
      />
    </div>
  );
};

export default AdminInvoices;
