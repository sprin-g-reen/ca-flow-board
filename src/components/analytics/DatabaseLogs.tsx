import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, Database, Activity, HardDrive, Network, Search, ChevronLeft, ChevronRight, Download, Trash2, Filter, MoreVertical } from 'lucide-react';
import apiClient from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface DatabaseStats {
  connections: {
    current: number;
    available: number;
    totalCreated: number;
  };
  operations: {
    insert: number;
    query: number;
    update: number;
    delete: number;
    getmore: number;
    command: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    numRequests: number;
  };
  memory: {
    resident: number;
    virtual: number;
  };
  database: {
    collections: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
    indexSize: number;
    documents: number;
  };
  uptime: number;
  version: string;
}

interface Activity {
  collection: string;
  timestamp: string;
  operation: string;
  dataPreview: string;
  details: string;
  executionTime: number | null;
  size: number;
  affectedFields: number;
}

export function DatabaseLogs() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filtering state
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  
  // Bulk actions state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/logs/stats') as { success: boolean; data: DatabaseStats };
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/logs/activities?limit=100') as { 
        success: boolean; 
        data: Activity[] 
      };
      if (response.success) {
        setActivities(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error Loading Logs",
        description: error.message || "Could not fetch database activities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchActivities();
  };

  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStats();
      fetchActivities();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getOperationColor = (op: string) => {
    switch (op.toLowerCase()) {
      case 'insert': return 'bg-green-500';
      case 'update': return 'bg-blue-500';
      case 'delete': return 'bg-red-500';
      case 'query': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.collection.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.dataPreview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCollection = selectedCollection === 'all' || activity.collection === selectedCollection;
    const matchesOperation = selectedOperation === 'all' || activity.operation.toLowerCase() === selectedOperation.toLowerCase();
    
    return matchesSearch && matchesCollection && matchesOperation;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  // Get unique collections and operations for filters
  const uniqueCollections = Array.from(new Set(activities.map(a => a.collection))).sort();
  const uniqueOperations = Array.from(new Set(activities.map(a => a.operation))).sort();

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedActivities.map((_, index) => startIndex + index)));
    }
    setSelectAll(!selectAll);
  };

  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === paginatedActivities.length);
  };

  const handleBulkExport = () => {
    const selectedActivities = Array.from(selectedRows).map(index => filteredActivities[index]);
    const csv = [
      ['Timestamp', 'Collection', 'Operation', 'Data Preview', 'Details', 'Execution Time (ms)', 'Size (bytes)', 'Fields'],
      ...selectedActivities.map(a => [
        new Date(a.timestamp).toISOString(),
        a.collection,
        a.operation,
        a.dataPreview,
        a.details,
        a.executionTime || 'N/A',
        a.size,
        a.affectedFields
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `database-logs-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported Successfully",
      description: `Exported ${selectedActivities.length} log entries`,
    });
  };

  const handleBulkClear = () => {
    const remainingActivities = activities.filter((_, index) => !selectedRows.has(index));
    setActivities(remainingActivities);
    setSelectedRows(new Set());
    setSelectAll(false);
    
    toast({
      title: "Logs Cleared",
      description: `Removed ${selectedRows.size} log entries from view`,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCollection('all');
    setSelectedOperation('all');
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [searchTerm, selectedCollection, selectedOperation, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.connections.current}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.connections.available} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.operations.query + stats.operations.insert + stats.operations.update + stats.operations.delete}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.operations.command} commands
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-500" />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.database.dataSize)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.database.documents.toLocaleString()} documents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="h-4 w-4 text-orange-500" />
                Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.network.numRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(stats.network.bytesIn + stats.network.bytesOut)} transferred
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Database Info Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Version</div>
                <div className="font-medium">{stats.version}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Uptime</div>
                <div className="font-medium">{formatUptime(stats.uptime)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Collections</div>
                <div className="font-medium">{stats.database.collections}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Indexes</div>
                <div className="font-medium">{stats.database.indexes}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Memory (Resident)</div>
                <div className="font-medium">{stats.memory.resident} MB</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Memory (Virtual)</div>
                <div className="font-medium">{stats.memory.virtual} MB</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Storage Size</div>
                <div className="font-medium">{formatBytes(stats.database.storageSize)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Index Size</div>
                <div className="font-medium">{formatBytes(stats.database.indexSize)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Database Activities
              </CardTitle>
              <CardDescription className="mt-2">
                Real-time monitoring of database operations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Live" : "Paused"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by collection, operation, data, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>
              
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  {uniqueCollections.map(collection => (
                    <SelectItem key={collection} value={collection}>
                      {collection}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Operations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  {uniqueOperations.map(operation => (
                    <SelectItem key={operation} value={operation.toLowerCase()}>
                      {operation.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm || selectedCollection !== 'all' || selectedOperation !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}

              {selectedRows.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted-foreground">
                    {selectedRows.size} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkClear}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[150px]">Collection</TableHead>
                  <TableHead className="w-[100px]">Operation</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[120px]">Details</TableHead>
                  <TableHead className="w-[100px]">Time (ms)</TableHead>
                  <TableHead className="w-[80px]">Size</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading activities...' : 'No activities found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedActivities.map((activity, index) => {
                    const actualIndex = startIndex + index;
                    return (
                      <TableRow key={actualIndex}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(actualIndex)}
                            onCheckedChange={() => handleRowSelect(actualIndex)}
                            aria-label={`Select row ${actualIndex + 1}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {new Date(activity.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {activity.collection}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getOperationColor(activity.operation)} text-white`}>
                            {activity.operation.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="truncate font-medium">{activity.dataPreview}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {activity.details || '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {activity.executionTime ? (
                            <Badge variant="outline" className="font-mono">
                              {activity.executionTime}ms
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatBytes(activity.size)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(activity.dataPreview);
                                toast({ title: "Copied", description: "Data preview copied to clipboard" });
                              }}>
                                Copy Data Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(activity.collection);
                                toast({ title: "Copied", description: "Collection name copied to clipboard" });
                              }}>
                                Copy Collection Name
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const info = `Collection: ${activity.collection}\nOperation: ${activity.operation}\nData: ${activity.dataPreview}\nDetails: ${activity.details}\nTime: ${activity.executionTime || 'N/A'}ms\nSize: ${formatBytes(activity.size)}\nFields: ${activity.affectedFields}`;
                                navigator.clipboard.writeText(info);
                                toast({ title: "Copied", description: "Full details copied to clipboard" });
                              }}>
                                Copy Full Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1} • Showing {startIndex + 1}-{Math.min(endIndex, filteredActivities.length)} of {filteredActivities.length}
                {autoRefresh && " • Auto-refreshing every 5s"}
              </span>
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
