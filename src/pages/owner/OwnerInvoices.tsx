
import { useState, useEffect } from 'react';
import { FileText, Plus, Download, Mail, Eye, Edit, Trash2, Check, X } from 'lucide-react';
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
import { toggleModal } from '@/store/slices/uiSlice';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';

interface InvoiceFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const OwnerInvoices = () => {
  const dispatch = useDispatch();
  const { modals } = useSelector((state: RootState) => state.ui);
  
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

  const handleOpenAddInvoiceModal = () => {
    dispatch(toggleModal({ modal: 'addInvoice', value: true }));
  };
  
  const handleCloseAddInvoiceModal = () => {
    dispatch(toggleModal({ modal: 'addInvoice', value: false }));
  };

  const handleFiltersChange = (newFilters: InvoiceFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    // Clear selection when filters change
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
    // Clear selection when filters reset
    setSelectedInvoices([]);
    setIsSelectAllChecked(false);
  };

  const handleStatusUpdate = async (invoiceId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ 
        invoiceId, 
        status: status as 'paid' | 'draft' | 'sent' | 'overdue' | 'cancelled' | 'partially_paid'
      });
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const result = await Swal.fire({
      title: 'Delete invoice? ',
      text: 'Are you sure you want to delete this invoice?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await deleteInvoiceMutation.mutateAsync(invoiceId);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      await Swal.fire({ title: 'Error', text: 'Failed to delete invoice', icon: 'error' });
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
    
    const confirmMessage = `Are you sure you want to delete ${selectedInvoices.length} invoice${selectedInvoices.length > 1 ? 's' : ''}?`;
    const result = await Swal.fire({ title: 'Confirm delete', text: confirmMessage, icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete' });
    if (!result.isConfirmed) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedInvoices);
      setSelectedInvoices([]);
      setIsSelectAllChecked(false);
    } catch (error) {
      console.error('Failed to delete invoices:', error);
      await Swal.fire({ title: 'Error', text: 'Failed to delete invoices', icon: 'error' });
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
    } catch (error) {
      console.error('Failed to update invoice statuses:', error);
    }
  };

  const handleBulkExport = async () => {
    // TODO: Implement bulk export functionality
    console.log('Exporting invoices:', selectedInvoices);
    await Swal.fire({ title: 'Not implemented', text: 'Bulk export feature coming soon!', icon: 'info' });
  };

  const clearSelection = () => {
    setSelectedInvoices([]);
    setIsSelectAllChecked(false);
  };

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      paid: "bg-green-100 hover:bg-green-200 text-green-800 hover:text-green-900",
      sent: "bg-blue-100 hover:bg-blue-200 text-blue-800 hover:text-blue-900",
      draft: "bg-gray-100 hover:bg-gray-200 text-gray-800 hover:text-gray-900",
      overdue: "bg-red-100 hover:bg-red-200 text-red-800 hover:text-red-900",
      partially_paid: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 hover:text-yellow-900",
      cancelled: "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900"
    };

    const statusLabels = {
      paid: "Paid",
      sent: "Sent", 
      draft: "Draft",
      overdue: "Overdue",
      partially_paid: "Partial",
      cancelled: "Cancelled"
    };

    return (
      <Badge className={badgeClasses[status as keyof typeof badgeClasses] || "bg-gray-100 text-gray-800"}>
        {statusLabels[status as keyof typeof statusLabels] || status}
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
    const subtotal = inv.items?.reduce((s: number, it: any) => s + (it.amount || (it.quantity || 0) * (it.rate || 0)), 0) || 0;
    const discountAmount = inv.discount?.amount || 0;
    const taxAmount = inv.taxAmount || 0;
    const total = inv.totalAmount || subtotal - discountAmount + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  };

  // Update select all state when invoices or selection changes
  useEffect(() => {
    if (invoices.length > 0) {
      const allSelected = invoices.every(invoice => selectedInvoices.includes(invoice._id));
      const someSelected = invoices.some(invoice => selectedInvoices.includes(invoice._id));
      setIsSelectAllChecked(allSelected && someSelected);
    }
  }, [invoices, selectedInvoices]);

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent pb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Invoices</CardTitle>
              <CardDescription className="mt-1">
                Manage and track client invoices and payments
              </CardDescription>
            </div>
            <Button 
              className="bg-ca-blue hover:bg-ca-blue-dark"
              onClick={handleOpenAddInvoiceModal}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-6">
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
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''} selected
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-blue-300"
                        disabled={bulkDeleteMutation.isPending || bulkUpdateStatusMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {bulkUpdateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('paid')}>
                        Mark as Paid
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('sent')}>
                        Mark as Sent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('overdue')}>
                        Mark as Overdue
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('cancelled')}>
                        Mark as Cancelled
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBulkExport}
                    className="border-blue-300"
                    disabled={bulkDeleteMutation.isPending || bulkUpdateStatusMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    disabled={bulkDeleteMutation.isPending || bulkUpdateStatusMutation.isPending}
                  >
                    {bulkDeleteMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-muted-foreground">Loading invoices...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-600">
                Failed to load invoices. <Button variant="link" onClick={() => refetch()}>Try again</Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && invoices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {filters.search || filters.status !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first invoice'
                }
              </p>
              {(!filters.search && filters.status === 'all') && (
                <Button onClick={handleOpenAddInvoiceModal} className="bg-ca-blue hover:bg-ca-blue-dark">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              )}
            </div>
          )}

          {/* Invoices Table */}
          {!isLoading && !error && invoices.length > 0 && (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isSelectAllChecked}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all invoices"
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
                    {invoices.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedInvoices.includes(invoice._id)}
                            onCheckedChange={(checked) => handleSelectInvoice(invoice._id, checked as boolean)}
                            aria-label={`Select invoice ${invoice.invoiceNumber}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{(invoice.client as any)?.fullName || invoice.client?.name || 'Unknown Client'}</div>
                            <div className="text-sm text-muted-foreground">{invoice.client?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <div className={invoice.isOverdue ? 'text-red-600 font-medium' : ''}>
                            {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                            {invoice.isOverdue && (
                              <div className="text-xs text-red-500">
                                {invoice.daysOverdue} days overdue
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">₹{invoice.totalAmount?.toLocaleString()}</div>
                            {invoice.paidAmount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Paid: ₹{invoice.paidAmount.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="5" r="2" fill="currentColor"/>
                                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                                  <circle cx="12" cy="19" r="2" fill="currentColor"/>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setPreviewInvoiceId(invoice._id)}>
                                <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2 text-green-600" />
                                <span>Edit Invoice</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer">
                                <Download className="h-4 w-4 mr-2 text-purple-600" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Mail className="h-4 w-4 mr-2 text-orange-600" />
                                <span>Send Email</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {invoice.status !== 'paid' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(invoice._id, 'paid')}
                                  className="cursor-pointer text-green-700 focus:text-green-800"
                                >
                                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                                  </svg>
                                  <span>Mark as Paid</span>
                                </DropdownMenuItem>
                              )}
                              {invoice.status === 'draft' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(invoice._id, 'sent')}
                                  className="cursor-pointer text-blue-700 focus:text-blue-800"
                                >
                                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="m22 2-7 20-4-9-9-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span>Send Invoice</span>
                                </DropdownMenuItem>
                              )}
                              {invoice.status === 'sent' && invoice.paidAmount === 0 && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusUpdate(invoice._id, 'overdue')}
                                  className="cursor-pointer text-amber-700 focus:text-amber-800"
                                >
                                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span>Mark Overdue</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                onClick={() => handleDeleteInvoice(invoice._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span>Delete Invoice</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.total > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageLimit) + 1} to {Math.min(currentPage * pageLimit, pagination.count)} of {pagination.count} invoices
                  </div>
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
            </>
          )}
          
            {/* Invoice Preview Modal */}
            <InvoicePreviewModal
              isOpen={!!previewInvoiceId}
              onClose={() => setPreviewInvoiceId(null)}
              invoiceData={previewInvoice}
              calculations={computeCalculations(previewInvoice)}
              isInterState={false}
              clientData={previewInvoice?.client}
            />

          <FormDialog
            open={modals.addInvoice}
            onOpenChange={handleCloseAddInvoiceModal}
            title="Create New Invoice"
            description="Generate a professional invoice for your client"
            showFooter={false}
            className="max-w-6xl"
          >
            <EnhancedInvoiceForm onSuccess={handleCloseAddInvoiceModal} />
          </FormDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerInvoices;
