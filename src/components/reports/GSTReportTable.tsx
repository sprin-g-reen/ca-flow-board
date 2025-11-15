import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  ArrowUpDown, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  FilePlus,
  FileSignature,
  Mail,
  MessageSquareMore
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GSTReportRow {
  id: string;
  invoiceNumber: string;
  monthName: string;
  clientName: string;
  clientId: string;
  gstin: string;
  gstStatus: string;
  gstReturnStatuses?: { type: string; status: string; filingDate?: string | null; arn?: string | null }[];
  gstTypes?: string[];
  hasPaid: boolean;
  invoiceRaised: boolean;
  quoteRaised: boolean;
  totalAmount: number;
  taxAmount: number;
  totalWithTax: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  items?: any[];
  notes?: string;
  terms?: string;
}

interface GSTReportTableProps {
  data: GSTReportRow[];
  isLoading: boolean;
  error: Error | null;
  onRowClick: (row: GSTReportRow) => void;
  onExportCSV: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  filterMonth: string;
  onFilterMonthChange: (month: string) => void;
  filterGstStatus: string;
  onFilterGstStatusChange: (status: string) => void;
  filterClient: string;
  onFilterClientChange: (client: string) => void;
  filterReturnType?: string;
  onFilterReturnTypeChange?: (val: string) => void;
  filterReturnStatus?: string;
  onFilterReturnStatusChange?: (val: string) => void;
}

export const GSTReportTable = ({
  data,
  isLoading,
  error,
  onRowClick,
  onExportCSV,
  page,
  pageSize,
  totalPages,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  filterMonth,
  onFilterMonthChange,
  filterGstStatus,
  onFilterGstStatusChange,
  filterClient,
  onFilterClientChange,
  filterReturnType,
  onFilterReturnTypeChange,
  filterReturnStatus,
  onFilterReturnStatusChange,
}: GSTReportTableProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  const allSelected = selectedIds.length > 0 && selectedIds.length === data.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(data.map(d => d.id));
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      paid: { label: 'Paid', variant: 'default' },
      pending: { label: 'Pending', variant: 'secondary' },
      overdue: { label: 'Overdue', variant: 'destructive' },
      draft: { label: 'Draft', variant: 'outline' },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getGSTStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
      suspended: { label: 'Suspended', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    
    const statusInfo = statusMap[status] || statusMap.unknown;
    return (
      <Badge variant="outline" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getReturnBadge = (type: string, status: string) => {
    const normalized = (status || 'Unknown').toLowerCase();
    let className = 'bg-gray-100 text-gray-800 border-gray-200';
    if (normalized === 'filed') className = 'bg-green-100 text-green-800 border-green-200';
    else if (normalized === 'pending') className = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    else if (normalized === 'partial') className = 'bg-blue-100 text-blue-800 border-blue-200';
    return (
      <Badge variant="outline" className={className}>
        {type}: {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return (
      <ArrowUpDown className={cn(
        "ml-2 h-4 w-4 transition-transform",
        sortOrder === 'desc' && 'rotate-180'
      )} />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            <Select value={filterReturnType || 'all'} onValueChange={(v) => onFilterReturnTypeChange && onFilterReturnTypeChange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="GST Return Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Returns</SelectItem>
                <SelectItem value="GSTR1">GSTR-1</SelectItem>
                <SelectItem value="GSTR3B">GSTR-3B</SelectItem>
                <SelectItem value="GSTR9">GSTR-9</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={filterReturnStatus || 'all'} onValueChange={(v) => onFilterReturnStatusChange && onFilterReturnStatusChange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Return Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Filed">Filed</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={filterGstStatus} onValueChange={onFilterGstStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="GST Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <Input
              placeholder="Search by client name..."
              value={filterClient}
              onChange={(e) => onFilterClientChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setExportOpen(true)} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </TableHead>
                <TableHead className="w-16">S.No</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('monthName')}
              >
                <div className="flex items-center">
                  Month Name
                  {renderSortIcon('monthName')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('clientName')}
              >
                <div className="flex items-center">
                  Client Name
                  {renderSortIcon('clientName')}
                </div>
              </TableHead>
              <TableHead>GST Returns</TableHead>
              <TableHead>GST Status</TableHead>
              <TableHead>Has Paid</TableHead>
              <TableHead>Invoice/Quote</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => onSort('totalAmount')}
              >
                <div className="flex items-center justify-end">
                  Total Amount
                  {renderSortIcon('totalAmount')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => onSort('taxAmount')}
              >
                <div className="flex items-center justify-end">
                  Tax Amount
                  {renderSortIcon('taxAmount')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => onSort('totalWithTax')}
              >
                <div className="flex items-center justify-end">
                  Total with Tax
                  {renderSortIcon('totalWithTax')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Loading report data...</span>
                </TableCell>
              </TableRow>
            )}
            {error && !isLoading && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center">
                  <h3 className="text-sm font-semibold text-red-600 mb-1">Error Loading Report</h3>
                  <p className="text-xs text-muted-foreground">{error.message}</p>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && data && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">No Data Available</h3>
                  <p className="text-xs text-muted-foreground">No records found for the selected period and filters.</p>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && data && data.length > 0 && data.map((row, index) => (
              <TableRow 
                key={row.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(row)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleOne(row.id)} aria-label={`Select ${row.clientName}`} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {(page - 1) * pageSize + index + 1}
                </TableCell>
                <TableCell className="font-medium">{row.monthName}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{row.clientName}</div>
                    <div className="text-xs text-muted-foreground">{row.gstin}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(row.gstReturnStatuses || []).map((r) => (
                      <span key={r.type + (r.status || '')}>{getReturnBadge(r.type, r.status)}</span>
                    ))}
                    {!row.gstReturnStatuses?.length && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getGSTStatusBadge(row.gstStatus)}</TableCell>
                <TableCell>
                  {row.hasPaid ? (
                    <Badge variant="default">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {row.invoiceRaised && <Badge variant="outline">Invoice</Badge>}
                    {row.quoteRaised && <Badge variant="outline">Quote</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.totalAmount)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.taxAmount)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(row.totalWithTax)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bulk actions (outside table for better UX) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/50">
          <div className="text-sm">{selectedIds.length} selected</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm"><FilePlus className="h-4 w-4 mr-1"/>Invoice</Button>
            <Button variant="outline" size="sm"><FileSignature className="h-4 w-4 mr-1"/>Quote</Button>
            <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1"/>Email</Button>
            <Button variant="outline" size="sm"><MessageSquareMore className="h-4 w-4 mr-1"/>Note</Button>
            <Button variant="default" size="sm" onClick={() => setExportOpen(true)}><Download className="h-4 w-4 mr-1"/>Export Sel.</Button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col max-w-xl p-0">
          <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
            <DialogTitle className="text-xl font-semibold">Export Report</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">Choose a format to export the current view or selected rows.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {selectedIds.length > 0 ? (
                  <span>{selectedIds.length} row(s) selected. Export will include only selected rows.</span>
                ) : (
                  <span>No rows selected. Export will include all rows on the current page.</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="outline" onClick={onExportCSV} className="w-full justify-center py-6">
                  <Download className="h-4 w-4 mr-2" /> CSV
                </Button>
                <Button variant="outline" className="w-full justify-center py-6" onClick={() => {
                  // Lazy import xlsx when needed
                  (async () => {
                    const XLSX = await import('xlsx');
                    const source = selectedIds.length > 0 ? data.filter(d => selectedIds.includes(d.id)) : data;
                    const rows = (source || []).map((row) => ({
                      Month: row.monthName,
                      Client: row.clientName,
                      GSTIN: row.gstin,
                      GST_Status: row.gstStatus,
                      GSTR1: (row.gstReturnStatuses||[]).find(r=>r.type==='GSTR1')?.status || 'Unknown',
                      GSTR3B: (row.gstReturnStatuses||[]).find(r=>r.type==='GSTR3B')?.status || 'Unknown',
                      GSTR9: (row.gstReturnStatuses||[]).find(r=>r.type==='GSTR9')?.status || '—',
                      Total_Amount: row.totalAmount,
                      Tax_Amount: row.taxAmount,
                      Total_With_Tax: row.totalWithTax,
                    }));
                    const ws = XLSX.utils.json_to_sheet(rows);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'GST Report');
                    XLSX.writeFile(wb, 'gst_report.xlsx');
                    setExportOpen(false);
                  })();
                }}>
                  <Download className="h-4 w-4 mr-2" /> Excel
                </Button>
                <Button variant="outline" className="w-full justify-center py-6" onClick={() => {
                  (async () => {
                    const jsPDF = (await import('jspdf')).default;
                    const autoTable = (await import('jspdf-autotable')).default;
                    const source = selectedIds.length > 0 ? data.filter(d => selectedIds.includes(d.id)) : data;
                    const doc = new jsPDF({ orientation: 'landscape' });
                    const head = [['S.No','Month','Client','GSTIN','GSTR1','GSTR3B','GSTR9','Total']];
                    const body = (source || []).map((row, i) => [
                      String(i+1),
                      row.monthName,
                      row.clientName,
                      row.gstin,
                      (row.gstReturnStatuses||[]).find(r=>r.type==='GSTR1')?.status || 'Unknown',
                      (row.gstReturnStatuses||[]).find(r=>r.type==='GSTR3B')?.status || 'Unknown',
                      (row.gstReturnStatuses||[]).find(r=>r.type==='GSTR9')?.status || '—',
                      String(row.totalWithTax)
                    ]);
                    (autoTable as any)(doc, { head, body, styles: { fontSize: 8 } });
                    doc.save('gst_report.pdf');
                    setExportOpen(false);
                  })();
                }}>
                  <Download className="h-4 w-4 mr-2" /> PDF
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 px-6 pb-6">
            <Button variant="outline" size="sm" onClick={() => setExportOpen(false)} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
