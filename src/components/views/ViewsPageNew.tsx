import React, { useState } from "react";
import { getValidatedToken } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/services/api";
import { PlusCircle, Trash2 } from "lucide-react";

type Operator = "$eq" | "$ne" | "$gt" | "$gte" | "$lt" | "$lte" | "$in" | "$regex";

const operatorLabels = {
  "$eq": "equals",
  "$ne": "not equals", 
  "$gt": "greater than",
  "$gte": "greater than or equal",
  "$lt": "less than",
  "$lte": "less than or equal",
  "$in": "is one of",
  "$regex": "contains",
};

// Simple field definitions for the debug version
const fieldDefinitions: Record<string, Array<{name: string; type: string; description: string; options?: string[]}>> = {
  clients: [
    { name: "name", type: "text", description: "Client company name" },
    { name: "email", type: "text", description: "Primary email address" },
    { name: "status", type: "select", description: "Client status", options: ["active", "inactive", "prospect"] },
    { name: "revenue", type: "number", description: "Annual revenue" },
  ],
  tasks: [
    { name: "title", type: "text", description: "Task title" },
    { name: "status", type: "select", description: "Task status", options: ["pending", "in-progress", "completed"] },
    { name: "priority", type: "select", description: "Task priority", options: ["low", "medium", "high", "urgent"] },
  ],
  invoices: [
    { name: "invoiceNumber", type: "text", description: "Invoice number" },
    { name: "amount", type: "number", description: "Invoice amount" },
    { name: "status", type: "select", description: "Invoice status", options: ["draft", "sent", "paid", "overdue"] },
  ],
  users: [
    { name: "name", type: "text", description: "User full name" },
    { name: "email", type: "text", description: "User email address" },
    { name: "role", type: "select", description: "User role", options: ["owner", "manager", "accountant"] },
  ],
};

export function ViewsPageNew() {
  const [entity, setEntity] = useState("clients");
  const [filters, setFilters] = useState<{ field: string; operator: Operator; value: any }[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddFilter = () => {
    setFilters(prev => [...prev, { field: "", operator: "$eq", value: "" }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index: number, key: string, value: any) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, [key]: value } : filter
    ));
  };

  const runQuery = async () => {
    setLoading(true);
    setRows([]);
    
    // Check if user is authenticated
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
    
    console.log("=== FRONTEND DEBUG START ===");
    console.log("Running query with entity:", entity);
    console.log("Running query with filters:", filters);

    const viewConfig = {
      name: `transient-view-${Date.now()}`,
      entity,
      config: { 
        filters: filters.map(f => ({ field: f.field, op: f.operator.replace('$', ''), value: f.value })), 
        columns: [] 
      },
      isTransient: true,
    };

    let transientViewId: string | null = null;

    try {
      console.log("Step 1: Creating transient view with config:", viewConfig);
      const createResponse = await apiClient.post("/views", viewConfig) as { success: boolean; data: { _id: string } };
      console.log("Step 1 Success: Transient view created with response:", createResponse);
      
      if (!createResponse || !createResponse.success || !createResponse.data || !createResponse.data._id) {
        throw new Error("Failed to create transient view: Invalid response from server.");
      }
      
      transientViewId = createResponse.data._id;
      console.log(`Step 2: Running transient view with ID: ${transientViewId}`);
      const runResponse = await apiClient.post(`/views/${transientViewId}/run`) as { success: boolean; data: { rows: any[]; pagination: any } };
      console.log("Step 2 Success: View run completed with response:", runResponse);

      // Handle structured response from backend
      const resultRows = runResponse?.data?.rows || [];
      setRows(Array.isArray(resultRows) ? resultRows : []);
      console.log("Final rows set:", resultRows.length);
      
      if (Array.isArray(resultRows) && resultRows.length === 0) {
        toast({
          title: "No Results",
          description: "Your query returned no results.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: `Found ${resultRows.length} results.`,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error during view execution:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      toast({
        title: "Error Running View",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("=== FRONTEND DEBUG END ===");
      if (transientViewId) {
        try {
          console.log(`Step 3: Deleting transient view with ID: ${transientViewId}`);
          await apiClient.delete(`/views/${transientViewId}`);
          console.log("Step 3 Success: Transient view deleted.");
        } catch (deleteError: any) {
          console.error("Failed to delete transient view:", deleteError);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create View (Debug Version)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entity Selection */}
          <div>
            <label className="text-sm font-medium">Entity</label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="invoices">Invoices</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Filters</label>
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
            {filters.map((filter, index) => {
              const selectedField = fieldDefinitions[entity]?.find(f => f.name === filter.field);
              return (
                <div key={index} className="p-3 border rounded-lg bg-gray-50/50 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Field Selection */}
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">Field</Label>
                      <Select
                        value={filter.field}
                        onValueChange={(value) => handleFilterChange(index, "field", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldDefinitions[entity]?.map(field => (
                            <SelectItem key={field.name} value={field.name}>
                              <div className="flex items-center gap-2">
                                <span>{field.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {field.type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator */}
                    <div className="w-[160px]">
                      <Label className="text-xs text-gray-600">Operator</Label>
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
                      size="sm"
                      onClick={() => handleRemoveFilter(index)}
                      className="mt-5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Value Selection */}
                  {filter.field && (
                    <div>
                      <Label className="text-xs text-gray-600">Value</Label>
                      {selectedField?.type === 'select' ? (
                        <div className="flex gap-2">
                          <Select
                            value={filter.value}
                            onValueChange={(value) => handleFilterChange(index, "value", value)}
                          >
                            <SelectTrigger className="flex-1">
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
                          <span className="text-xs text-gray-500 flex items-center">or</span>
                          <Input
                            placeholder="Custom value"
                            value={selectedField.options?.includes(filter.value) ? "" : filter.value}
                            onChange={(e) => handleFilterChange(index, "value", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      ) : (
                        <Input
                          placeholder={`Enter ${selectedField?.type || 'value'}...`}
                          value={filter.value}
                          onChange={(e) => handleFilterChange(index, "value", e.target.value)}
                          type={selectedField?.type === 'number' ? 'number' : 'text'}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Run Button */}
          <Button onClick={runQuery} disabled={loading} className="w-full">
            {loading ? "Running..." : "Run Query"}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>Tip: Try no filters first to see all data, or add a filter like "name" contains "test"</p>
            <p>Current entity: {entity} | Filters: {filters.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({rows.length} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rows.slice(0, 5).map((row, index) => (
                <div key={index} className="p-2 border rounded text-sm">
                  <pre>{JSON.stringify(row, null, 2)}</pre>
                </div>
              ))}
              {rows.length > 5 && (
                <p className="text-muted-foreground">...and {rows.length - 5} more rows</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {!loading && rows.length === 0 && filters.length >= 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {filters.length === 0 
              ? "Click 'Run Query' to fetch all data, or add filters to narrow your search."
              : "No results found. Check your filters and try again."
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
}