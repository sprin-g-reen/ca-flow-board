import React, { useState, useEffect } from "react";
import { getValidatedToken } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/services/api";
import { ViewCharts } from "./ViewCharts";
import { 
  PlusCircle, 
  Trash2, 
  Download, 
  FileText, 
  Table as TableIcon,
  BarChart3,
  LineChart,
  PieChart,
  Eye,
  Save,
  Play,
  ArrowUpDown,
  Filter as FilterIcon,
  SettingsIcon,
  MoreHorizontal,
  Edit,
  Clock,
  User
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from 'date-fns';

type Operator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "regex" | "exists";

const operatorLabels = {
  eq: "equals",
  ne: "not equals", 
  gt: "greater than",
  gte: "greater than or equal",
  lt: "less than",
  lte: "less than or equal",
  in: "is one of",
  regex: "contains",
  exists: "exists",
};

interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  searchable?: boolean;
  sortable?: boolean;
  options?: string[];
  refEntity?: string;
}

interface ViewData {
  rows: any[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  entity: string;
  fieldDefinitions: FieldDefinition[];
}

export function ViewsPageEnhanced() {
  const [entity, setEntity] = useState("clients");
  const [filters, setFilters] = useState<{ field: string; operator: Operator; value: any }[]>([]);
  const [viewData, setViewData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldDefinitions, setFieldDefinitions] = useState<Record<string, FieldDefinition[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewName, setViewName] = useState("");
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<"table" | "chart">("table");
  const [activeTab, setActiveTab] = useState<string>("query");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Fetch field definitions on mount
  useEffect(() => {
    fetchFieldDefinitions();
    fetchSavedViews();
  }, []);

  // Fetch field definitions when entity changes
  useEffect(() => {
    if (!fieldDefinitions[entity]) {
      fetchFieldDefinitions(entity);
    }
  }, [entity]);

  const fetchFieldDefinitions = async (specificEntity?: string) => {
    try {
      const endpoint = specificEntity ? `/views/fields?entity=${specificEntity}` : '/views/fields';
      const response = await apiClient.get(endpoint) as { success: boolean; data: any };
      
      if (specificEntity) {
        setFieldDefinitions(prev => ({ ...prev, [specificEntity]: response.data }));
      } else {
        setFieldDefinitions(response.data);
      }
    } catch (error) {
      console.error('Error fetching field definitions:', error);
    }
  };

  const fetchSavedViews = async () => {
    try {
      const response = await apiClient.get('/views') as { success: boolean; data: any[] };
      setSavedViews(response.data || []);
    } catch (error) {
      console.error('Error fetching saved views:', error);
    }
  };

  const handleAddFilter = () => {
    setFilters(prev => [...prev, { field: "", operator: "eq", value: "" }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index: number, key: string, value: any) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, [key]: value } : filter
    ));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const runQuery = async (page = currentPage) => {
    setLoading(true);
    
    const token = getValidatedToken();
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to run queries.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const viewConfig = {
      name: viewName || `temp-view-${Date.now()}`,
      entity,
      config: { 
        filters: filters.map(f => ({ field: f.field, op: f.operator, value: f.value })), 
        columns: [],
        sort: sortField ? [{ field: sortField, direction: sortDirection }] : []
      },
    };

    let transientViewId: string | null = currentViewId;

    try {
      if (!transientViewId) {
        const createResponse = await apiClient.post("/views", viewConfig) as { success: boolean; data: { _id: string } };
        
        if (!createResponse?.success || !createResponse.data?._id) {
          throw new Error("Failed to create view");
        }
        
        transientViewId = createResponse.data._id;
        setCurrentViewId(transientViewId);
      }
      
      const runResponse = await apiClient.post(`/views/${transientViewId}/run`, { page, pageSize }) as { 
        success: boolean; 
        data: ViewData 
      };

      if (runResponse?.success && runResponse.data) {
        setViewData(runResponse.data);
        setCurrentPage(page);
        
        // Automatically switch to results tab when data is loaded
        setActiveTab("results");
        
        toast({
          title: "Success",
          description: `Found ${runResponse.data.pagination.total} results.`,
        });
      }
    } catch (error: any) {
      console.error("Error running view:", error);
      toast({
        title: "Error Running View",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveView = async () => {
    if (!viewName) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your view.",
        variant: "destructive",
      });
      return;
    }

    try {
      const viewConfig = {
        name: viewName,
        entity,
        scope: 'private',
        config: { 
          filters: filters.map(f => ({ field: f.field, op: f.operator, value: f.value })), 
          columns: [],
          sort: sortField ? [{ field: sortField, direction: sortDirection }] : []
        },
      };

      const response = await apiClient.post("/views", viewConfig) as { success: boolean; data: any };
      
      if (response.success) {
        toast({
          title: "View Saved",
          description: `"${viewName}" has been saved successfully.`,
        });
        fetchSavedViews();
        setViewName("");
      }
    } catch (error: any) {
      toast({
        title: "Error Saving View",
        description: error.message || "Failed to save view.",
        variant: "destructive",
      });
    }
  };

  const loadView = async (viewId: string) => {
    try {
      const response = await apiClient.get(`/views/${viewId}`) as { success: boolean; data: any };
      
      if (response.success && response.data) {
        const view = response.data;
        setEntity(view.entity);
        setViewName(view.name);
        setSelectedView(viewId);
        setCurrentViewId(viewId);
        
        // Load filters
        const loadedFilters = view.config?.filters?.map((f: any) => ({
          field: f.field,
          operator: f.op || 'eq',
          value: f.value
        })) || [];
        setFilters(loadedFilters);
        
        // Load sort
        if (view.config?.sort?.length) {
          setSortField(view.config.sort[0].field);
          setSortDirection(view.config.sort[0].direction);
        }
        
        // Run the view
        await runQuery(1);
      }
    } catch (error: any) {
      toast({
        title: "Error Loading View",
        description: error.message || "Failed to load view.",
        variant: "destructive",
      });
    }
  };

  const exportData = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!currentViewId) {
      toast({
        title: "Run Query First",
        description: "Please run a query before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = getValidatedToken();
      const url = `http://localhost:5000/api/views/${currentViewId}/export/${format}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error:', errorText);
        throw new Error('Export failed');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `export-${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      toast({
        title: "Export Successful",
        description: `Data exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Could not export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(viewData?.rows.map(row => row._id || row.id) || []);
      setSelectedRows(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectRow = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === viewData?.rows.length);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedRows.size} item(s)?`)) {
      return;
    }

    try {
      // Call bulk delete endpoint
      await apiClient.post(`/${entity}/bulk-delete`, {
        ids: Array.from(selectedRows)
      });

      toast({
        title: "Success",
        description: `${selectedRows.size} item(s) deleted successfully.`,
      });

      // Refresh the view
      await runQuery(currentPage);
      setSelectedRows(new Set());
      setSelectAll(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete items.",
        variant: "destructive",
      });
    }
  };

  const currentFields = fieldDefinitions[entity] || [];
  const displayColumns = viewData?.fieldDefinitions || currentFields;
  const totalPages = viewData ? Math.ceil(viewData.pagination.total / pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Views</h2>
          <p className="text-muted-foreground">
            Build powerful queries, analyze data, and export insights
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Saved Views
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Your Views</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {savedViews.map((view) => (
              <DropdownMenuItem key={view._id} onClick={() => loadView(view._id)}>
                {view.name}
                <Badge variant="outline" className="ml-auto">
                  {view.entity}
                </Badge>
              </DropdownMenuItem>
            ))}
            {savedViews.length === 0 && (
              <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="query">
            <FilterIcon className="h-4 w-4 mr-2" />
            Query Builder
          </TabsTrigger>
          <TabsTrigger value="results">
            <TableIcon className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="visualization">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visualization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Your Query</CardTitle>
              <CardDescription>
                Select an entity and add filters to create custom views
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* View Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>View Name (Optional)</Label>
                  <Input
                    placeholder="e.g., Active Clients with GST"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                  />
                </div>

                {/* Entity Selection */}
                <div>
                  <Label>Entity</Label>
                  <Select value={entity} onValueChange={(val) => {
                    setEntity(val);
                    setFilters([]);
                    setViewData(null);
                    setCurrentViewId(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clients">Clients</SelectItem>
                      <SelectItem value="tasks">Tasks</SelectItem>
                      <SelectItem value="invoices">Invoices</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="chat_messages">Chat Messages</SelectItem>
                      <SelectItem value="chat_rooms">Chat Rooms</SelectItem>
                      <SelectItem value="communications">Communications</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="notifications">Notifications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Filters</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFilter}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Filter
                  </Button>
                </div>
                
                {filters.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <FilterIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No filters added. Click "Add Filter" to start building your query.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {filters.map((filter, index) => {
                    const selectedField = currentFields.find(f => f.name === filter.field);
                    return (
                      <div key={index} className="p-4 border rounded-lg bg-slate-50 space-y-3">
                        <div className="flex items-center gap-3">
                          {/* Field Selection */}
                          <div className="flex-1">
                            <Label className="text-xs text-gray-600 mb-1">Field</Label>
                            <Select
                              value={filter.field}
                              onValueChange={(value) => handleFilterChange(index, "field", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose field..." />
                              </SelectTrigger>
                              <SelectContent>
                                {currentFields.map(field => (
                                  <SelectItem key={field.name} value={field.name}>
                                    <div className="flex items-center gap-2">
                                      <span>{field.label}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {field.type}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Operator */}
                          <div className="w-[180px]">
                            <Label className="text-xs text-gray-600 mb-1">Operator</Label>
                            <Select
                              value={filter.operator}
                              onValueChange={(value) => handleFilterChange(index, "operator", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(operatorLabels).map(([op, label]) => (
                                  <SelectItem key={op} value={op}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Remove Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFilter(index)}
                            className="mt-5"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        {/* Value Selection */}
                        {filter.field && (
                          <div>
                            <Label className="text-xs text-gray-600 mb-1">Value</Label>
                            {selectedField?.type === 'select' || selectedField?.options ? (
                              <Select
                                value={filter.value}
                                onValueChange={(value) => handleFilterChange(index, "value", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select value..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedField.options?.map(option => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                placeholder={`Enter ${selectedField?.type || 'value'}...`}
                                value={filter.value}
                                onChange={(e) => handleFilterChange(index, "value", e.target.value)}
                                type={selectedField?.type === 'number' ? 'number' : 
                                      selectedField?.type === 'date' ? 'date' : 'text'}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={() => runQuery(1)} disabled={loading} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  {loading ? "Running..." : "Run Query"}
                </Button>
                
                {viewName && (
                  <Button onClick={saveView} variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save View
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {viewData && viewData.rows.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Query Results</CardTitle>
                    <CardDescription>
                      Showing {viewData.rows.length} of {viewData.pagination.total} results
                    </CardDescription>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportData('csv')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportData('excel')}>
                        <TableIcon className="h-4 w-4 mr-2" />
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportData('pdf')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bulk Actions Bar */}
                {selectedRows.size > 0 && (
                  <div className="flex items-center justify-between p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        {selectedRows.size} item(s) selected
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedRows(new Set());
                          setSelectAll(false);
                        }}
                      >
                        Clear Selection
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        {displayColumns.slice(0, 5).map((field) => (
                          <TableHead key={field.name}>
                            <div className="flex items-center gap-2">
                              {field.label}
                              {field.sortable && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleSort(field.name)}
                                >
                                  <ArrowUpDown className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Created
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            User
                          </div>
                        </TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewData.rows.map((row, index) => {
                        const rowId = row._id || row.id || `row-${index}`;
                        return (
                          <TableRow key={rowId} className={selectedRows.has(rowId) ? 'bg-blue-50' : ''}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedRows.has(rowId)}
                                onCheckedChange={() => handleSelectRow(rowId)}
                              />
                            </TableCell>
                            {displayColumns.slice(0, 5).map((field) => {
                              let value = row[field.name];
                              
                              // Format dates
                              if (field.type === 'date' && value) {
                                value = new Date(value).toLocaleDateString();
                              }
                              
                              // Format references
                              if (field.type === 'reference' && value && typeof value === 'object') {
                                value = value.name || value.fullName || value.email || value._id;
                              }
                              
                              // Format boolean
                              if (field.type === 'boolean') {
                                value = value ? 'Yes' : 'No';
                              }
                              
                              // Format numbers
                              if (field.type === 'number' && typeof value === 'number') {
                                value = value.toLocaleString();
                              }
                              
                              return (
                                <TableCell key={field.name}>
                                  {value !== null && value !== undefined ? String(value) : '-'}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-xs text-muted-foreground">
                              {row.createdAt ? (
                                <div>
                                  <div>{new Date(row.createdAt).toLocaleDateString()}</div>
                                  <div className="text-xs">{formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}</div>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {row.createdBy ? (
                                typeof row.createdBy === 'object' ? 
                                  row.createdBy.fullName || row.createdBy.email || row.createdBy._id :
                                  row.createdBy
                              ) : row.user ? (
                                typeof row.user === 'object' ?
                                  row.user.fullName || row.user.email || row.user._id :
                                  row.user
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runQuery(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runQuery(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Results</h3>
                  <p className="text-muted-foreground">
                    Run a query to see results here
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          {viewData && currentViewId ? (
            <ViewCharts 
              viewId={currentViewId}
              entity={entity}
              fieldDefinitions={currentFields}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Run a Query First</h3>
                  <p className="text-muted-foreground mb-4">
                    Build and run a query to enable data visualization
                  </p>
                  <Button variant="outline" onClick={() => document.querySelector<HTMLButtonElement>('[value="query"]')?.click()}>
                    Go to Query Builder
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
