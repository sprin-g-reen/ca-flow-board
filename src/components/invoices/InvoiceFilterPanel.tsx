import { useState } from 'react';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface InvoiceFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface InvoiceFilterPanelProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  onReset: () => void;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'issueDate', label: 'Issue Date' },
  { value: 'totalAmount', label: 'Amount' },
  { value: 'invoiceNumber', label: 'Invoice Number' },
];

export const InvoiceFilterPanel = ({ 
  filters, 
  onFiltersChange, 
  onReset 
}: InvoiceFilterPanelProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleSortChange = (field: string) => {
    // If same field, toggle order, otherwise use desc as default
    if (filters.sortBy === field) {
      const newOrder = filters.sortOrder === 'desc' ? 'asc' : 'desc';
      onFiltersChange({ ...filters, sortOrder: newOrder });
    } else {
      onFiltersChange({ ...filters, sortBy: field, sortOrder: 'desc' });
    }
  };

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    onFiltersChange({ ...filters, sortOrder: order });
  };

  const activeFiltersCount = [
    filters.search && filters.search.length > 0,
    filters.status && filters.status !== 'all',
    filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc'
  ].filter(Boolean).length;

  const getStatusLabel = (value: string) => {
    return statusOptions.find(option => option.value === value)?.label || value;
  };

  const getSortLabel = (value: string) => {
    return sortOptions.find(option => option.value === value)?.label || value;
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices, clients, or notes..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filters */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Sort
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Sort & Filter</h4>
                  <Button variant="ghost" size="sm" onClick={onReset}>
                    Reset
                  </Button>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort by</label>
                  <div className="grid grid-cols-1 gap-2">
                    {sortOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filters.sortBy === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange(option.value)}
                        className="justify-between text-left"
                      >
                        <span>{option.label}</span>
                        {filters.sortBy === option.value && (
                          filters.sortOrder === 'desc' ? 
                            <SortDesc className="h-4 w-4" /> : 
                            <SortAsc className="h-4 w-4" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.sortOrder === 'desc' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSortOrderChange('desc')}
                      className="flex-1"
                    >
                      <SortDesc className="h-4 w-4 mr-2" />
                      Newest First
                    </Button>
                    <Button
                      variant={filters.sortOrder === 'asc' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSortOrderChange('asc')}
                      className="flex-1"
                    >
                      <SortAsc className="h-4 w-4 mr-2" />
                      Oldest First
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Reset Button */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleSearchChange('')}
              />
            </Badge>
          )}
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {getStatusLabel(filters.status)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleStatusChange('all')}
              />
            </Badge>
          )}
          {(filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Sort: {getSortLabel(filters.sortBy)} ({filters.sortOrder === 'desc' ? 'Newest' : 'Oldest'})
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, sortBy: 'createdAt', sortOrder: 'desc' })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};