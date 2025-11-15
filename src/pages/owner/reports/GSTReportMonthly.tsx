import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GSTReportTable, GSTReportRow } from '@/components/reports/GSTReportTable';
import { GSTReportDetailModal } from '@/components/reports/GSTReportDetailModal';
import { Calendar, FileBarChart } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api';

const GSTReportMonthly = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  
  const [data, setData] = useState<GSTReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const [selectedRow, setSelectedRow] = useState<GSTReportRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [filterMonth, setFilterMonth] = useState('');
  const [filterGstStatus, setFilterGstStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('');
  const [filterReturnType, setFilterReturnType] = useState('all');
  const [filterReturnStatus, setFilterReturnStatus] = useState('all');

  // Generate year options (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => {
    const year = currentDate.getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Generate month options
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        reportType: 'monthly',
        year: selectedYear,
        month: selectedMonth,
        page,
        pageSize,
        sortBy,
        sortOrder,
      };

      if (filterGstStatus && filterGstStatus !== 'all') {
        params.filterGstStatus = filterGstStatus;
      }

      if (filterClient) {
        params.filterClient = filterClient;
      }

  if (filterReturnType && filterReturnType !== 'all') params.filterReturnType = filterReturnType;
  if (filterReturnStatus && filterReturnStatus !== 'all') params.filterReturnStatus = filterReturnStatus;

  const response = await apiClient.get('/reports/gst', params) as any;

      if (response.success) {
        setData(response.data.items);
        setTotalPages(response.data.totalPages);
      } else {
        throw new Error(response.message || 'Failed to fetch report');
      }
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load report', {
        description: err.message || 'An error occurred while loading the report',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth, page, sortBy, sortOrder, filterGstStatus, filterClient, filterReturnType, filterReturnStatus]);

  const handleRowClick = (row: GSTReportRow) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Month Name',
      'Client Name',
      'GSTIN',
      'GST Status',
      'Has Paid',
      'Invoice Raised',
      'Quote Raised',
      'Total Amount',
      'Tax Amount',
      'Total with Tax',
    ];

    const rows = data.map(row => [
      row.monthName,
      row.clientName,
      row.gstin,
      row.gstStatus,
      row.hasPaid ? 'Yes' : 'No',
      row.invoiceRaised ? 'Yes' : 'No',
      row.quoteRaised ? 'Yes' : 'No',
      row.totalAmount,
      row.taxAmount,
      row.totalWithTax,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `gst_report_monthly_${selectedYear}_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report exported successfully');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileBarChart className="h-8 w-8 text-blue-600" />
            GST Monthly Report
          </h1>
          <p className="text-muted-foreground mt-2">
            View monthly GST reports with detailed invoice information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Period
              </CardTitle>
              <CardDescription>Choose a month and year to view the report</CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GSTReportTable
            data={data}
            isLoading={isLoading}
            error={error}
            onRowClick={handleRowClick}
            onExportCSV={handleExportCSV}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={setPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            filterMonth={filterMonth}
            onFilterMonthChange={setFilterMonth}
            filterGstStatus={filterGstStatus}
            onFilterGstStatusChange={setFilterGstStatus}
            filterClient={filterClient}
            onFilterClientChange={setFilterClient}
            filterReturnType={filterReturnType}
            onFilterReturnTypeChange={setFilterReturnType}
            filterReturnStatus={filterReturnStatus}
            onFilterReturnStatusChange={setFilterReturnStatus}
          />
        </CardContent>
      </Card>

      <GSTReportDetailModal
        row={selectedRow}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default GSTReportMonthly;
