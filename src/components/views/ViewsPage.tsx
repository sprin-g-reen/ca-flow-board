import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, X, HelpCircle, ChevronDown } from "lucide-react";
import apiClient from "@/services/api";

interface FieldDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  description: string;
  example?: string;
  options?: string[];
}

const fieldDefinitions: Record<string, FieldDefinition[]> = {
  clients: [
    { name: "name", type: "text", description: "Client company name", example: "ABC Corp" },
    { name: "email", type: "text", description: "Primary email address", example: "contact@abccorp.com" },
    { name: "phone", type: "text", description: "Contact phone number", example: "+91 9876543210" },
    { name: "status", type: "select", description: "Client status", options: ["active", "inactive", "prospect", "archived"], example: "active" },
    { name: "gstNumber", type: "text", description: "GST registration number", example: "27AAPFU0939F1ZV" },
    { name: "panNumber", type: "text", description: "PAN number", example: "AAPFU0939F" },
    { name: "cinNumber", type: "text", description: "CIN number", example: "U72900KA2020PTC134123" },
    { name: "revenue", type: "number", description: "Annual revenue in INR", example: "5000000" },
    { name: "industry", type: "select", description: "Industry sector", options: ["manufacturing", "services", "trading", "consulting", "technology", "healthcare", "education", "other"], example: "technology" },
    { name: "city", type: "text", description: "City location", example: "Bangalore" },
    { name: "state", type: "text", description: "State location", example: "Karnataka" },
    { name: "pincode", type: "text", description: "Postal code", example: "560001" },
    { name: "createdAt", type: "date", description: "Client registration date", example: "2024-01-15" },
    { name: "lastContactDate", type: "date", description: "Last contact date", example: "2024-10-15" },
  ],
  tasks: [
    { name: "title", type: "text", description: "Task title", example: "GST Return Filing" },
    { name: "description", type: "text", description: "Task description", example: "File monthly GST return" },
    { name: "status", type: "select", description: "Task status", options: ["pending", "in-progress", "completed", "cancelled", "on-hold"], example: "pending" },
    { name: "priority", type: "select", description: "Task priority", options: ["low", "medium", "high", "urgent"], example: "high" },
    { name: "assignedTo", type: "text", description: "Assigned user email", example: "john@firm.com" },
    { name: "assignedBy", type: "text", description: "Task creator email", example: "manager@firm.com" },
    { name: "dueDate", type: "date", description: "Task due date", example: "2024-11-15" },
    { name: "completedDate", type: "date", description: "Task completion date", example: "2024-11-10" },
    { name: "category", type: "select", description: "Task category", options: ["GST", "Income Tax", "Audit", "Compliance", "Consultation", "Other"], example: "GST" },
    { name: "estimatedHours", type: "number", description: "Estimated hours", example: "8" },
    { name: "actualHours", type: "number", description: "Actual hours spent", example: "6.5" },
    { name: "billable", type: "boolean", description: "Is task billable", example: "true" },
  ],
  invoices: [
    { name: "invoiceNumber", type: "text", description: "Invoice number", example: "INV-2024-001" },
    { name: "amount", type: "number", description: "Invoice amount in INR", example: "25000" },
    { name: "taxAmount", type: "number", description: "Tax amount", example: "4500" },
    { name: "totalAmount", type: "number", description: "Total amount including tax", example: "29500" },
    { name: "status", type: "select", description: "Invoice status", options: ["draft", "sent", "paid", "overdue", "cancelled", "partially-paid"], example: "sent" },
    { name: "dueDate", type: "date", description: "Payment due date", example: "2024-11-30" },
    { name: "issueDate", type: "date", description: "Invoice issue date", example: "2024-11-01" },
    { name: "paidDate", type: "date", description: "Payment received date", example: "2024-11-25" },
    { name: "paymentMethod", type: "select", description: "Payment method", options: ["bank-transfer", "cheque", "cash", "upi", "credit-card", "other"], example: "bank-transfer" },
    { name: "clientName", type: "text", description: "Client name", example: "ABC Corp" },
    { name: "isRecurring", type: "boolean", description: "Is recurring invoice", example: "false" },
  ],
  users: [
    { name: "name", type: "text", description: "User full name", example: "John Doe" },
    { name: "email", type: "text", description: "User email address", example: "john@firm.com" },
    { name: "role", type: "select", description: "User role", options: ["owner", "manager", "senior-accountant", "accountant", "junior", "intern"], example: "accountant" },
    { name: "department", type: "select", description: "Department", options: ["audit", "taxation", "compliance", "consulting", "admin", "hr"], example: "taxation" },
    { name: "isActive", type: "boolean", description: "User active status", example: "true" },
    { name: "joinDate", type: "date", description: "Joining date", example: "2024-01-15" },
    { name: "lastLoginDate", type: "date", description: "Last login date", example: "2024-11-01" },
    { name: "phone", type: "text", description: "Phone number", example: "+91 9876543210" },
    { name: "experience", type: "number", description: "Years of experience", example: "5" },
  ],
};

const quickTemplates = [
  { name: "Active Clients", entity: "clients", filters: [{ field: "status", operator: "equals", value: "active" }] },
  { name: "High Revenue Clients", entity: "clients", filters: [{ field: "revenue", operator: "gte", value: "1000000" }] },
  { name: "Technology Clients", entity: "clients", filters: [{ field: "industry", operator: "equals", value: "technology" }] },
  { name: "Overdue Invoices", entity: "invoices", filters: [{ field: "status", operator: "equals", value: "overdue" }] },
  { name: "Large Invoices", entity: "invoices", filters: [{ field: "amount", operator: "gte", value: "50000" }] },
  { name: "Recent Invoices", entity: "invoices", filters: [{ field: "issueDate", operator: "gte", value: "2024-10-01" }] },
  { name: "High Priority Tasks", entity: "tasks", filters: [{ field: "priority", operator: "equals", value: "high" }] },
  { name: "Pending GST Tasks", entity: "tasks", filters: [{ field: "category", operator: "equals", value: "GST" }, { field: "status", operator: "equals", value: "pending" }] },
  { name: "Overdue Tasks", entity: "tasks", filters: [{ field: "dueDate", operator: "lt", value: new Date().toISOString().split('T')[0] }] },
  { name: "Active Users", entity: "users", filters: [{ field: "isActive", operator: "equals", value: "true" }] },
  { name: "Senior Staff", entity: "users", filters: [{ field: "role", operator: "equals", value: "senior-accountant" }] },
];

export default function ViewsPage() {
  const [views, setViews] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const [viewData, setViewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFieldReference, setShowFieldReference] = useState(false);

  // View creation form state
  const [viewName, setViewName] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("clients");
  const [filters, setFilters] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);

  useEffect(() => {
    fetchViews();
  }, []);

  const fetchViews = async () => {
    try {
      const response = await apiClient.get('/views') as { success: boolean; data: any[] };
      setViews(response?.data || []);
    } catch (error) {
      console.error('Error fetching views:', error);
    }
  };

  const loadTemplate = (template: any) => {
    setViewName(template.name);
    setSelectedEntity(template.entity);
    setFilters(template.filters);
    // Auto-select relevant fields based on entity
    const entityFields = fieldDefinitions[template.entity]?.slice(0, 5).map(field => field.name) || [];
    setSelectedFields(entityFields);
  };

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: "",
      operator: "equals",
      value: ""
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (filterId: number, updates: any) => {
    setFilters(filters.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (filterId: number) => {
    setFilters(filters.filter(filter => filter.id !== filterId));
  };

  const createView = async () => {
    if (!viewName.trim()) {
      alert('Please enter a view name');
      return;
    }

    try {
      const viewConfig = {
        name: viewName,
        entity: selectedEntity,
        filters: filters.filter(f => f.field && f.value),
        fields: selectedFields
      };

      const response = await apiClient.post('/views', viewConfig) as { success: boolean; data: any };
      setViews([...views, response.data]);
      
      // Reset form
      setViewName("");
      setFilters([]);
      setSelectedFields([]);
      
      alert('View created successfully!');
    } catch (error) {
      console.error('Error creating view:', error);
      alert('Error creating view');
    }
  };

  const executeView = async (view: any) => {
    setLoading(true);
    setSelectedView(view);
    
    try {
      const response = await apiClient.post('/views/execute', {
        entity: view.entity,
        filters: view.filters,
        fields: view.fields
      }) as { success: boolean; data: { rows: any[] } };
      setViewData(response?.data?.rows || []);
    } catch (error) {
      console.error('Error executing view:', error);
      alert('Error executing view');
    } finally {
      setLoading(false);
    }
  };

  const getFieldType = (fieldName: string): string => {
    const field = fieldDefinitions[selectedEntity]?.find(f => f.name === fieldName);
    return field?.type || 'text';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Views</h1>
        <Button 
          variant="outline" 
          onClick={() => setShowFieldReference(!showFieldReference)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Field Reference
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* View Creation Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New View</CardTitle>
              <CardDescription>
                Build custom queries to filter and organize your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Templates */}
              <div>
                <Label className="text-sm font-medium">Quick Templates</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickTemplates.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate(template)}
                      className="text-xs"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* View Name */}
              <div>
                <Label htmlFor="viewName">View Name</Label>
                <Input
                  id="viewName"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="e.g., Active High-Value Clients"
                />
              </div>

              {/* Entity Selection */}
              <div>
                <Label htmlFor="entity">Data Source</Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="invoices">Invoices</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field Explorer */}
              <div>
                <Label className="text-sm font-medium">Available Fields for {selectedEntity}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                  {fieldDefinitions[selectedEntity]?.slice(0, 6).map(field => (
                    <Button
                      key={field.name}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFilter = {
                          id: Date.now(),
                          field: field.name,
                          operator: "equals",
                          value: ""
                        };
                        setFilters([...filters, newFilter]);
                      }}
                      className="justify-start h-auto p-2 hover:bg-blue-100"
                    >
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">{field.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[120px]">
                          {field.description}
                        </span>
                      </div>
                    </Button>
                  ))}
                  {fieldDefinitions[selectedEntity]?.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFieldReference(!showFieldReference)}
                      className="justify-start h-auto p-2 text-blue-600 hover:bg-blue-100"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-medium">
                          +{fieldDefinitions[selectedEntity].length - 6} more
                        </span>
                        <span className="text-xs">View all fields</span>
                      </div>
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div>
                <div className="flex justify-between items-center">
                  <Label>Filters</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addFilter}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Filter
                  </Button>
                </div>
                
                <div className="space-y-3 mt-2">
                  {filters.map((filter) => {
                    const selectedField = fieldDefinitions[selectedEntity]?.find(f => f.name === filter.field);
                    const fieldType = selectedField?.type || 'text';
                    
                    return (
                      <div key={filter.id} className="p-4 border rounded-lg bg-gray-50/50 space-y-3">
                        {/* Field Selection Row */}
                        <div className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Label className="text-xs text-gray-600 mb-1 block">Field</Label>
                            <Select 
                              value={filter.field} 
                              onValueChange={(value) => updateFilter(filter.id, { field: value, value: "" })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a field..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {fieldDefinitions[selectedEntity]?.map(field => (
                                  <SelectItem key={field.name} value={field.name}>
                                    <div className="flex flex-col items-start py-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{field.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {field.type}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-gray-500">{field.description}</span>
                                      {field.example && (
                                        <span className="text-xs text-blue-600">e.g., {field.example}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="w-[140px]">
                            <Label className="text-xs text-gray-600 mb-1 block">Operator</Label>
                            <Select 
                              value={filter.operator} 
                              onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Operator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                {fieldType === 'number' && (
                                  <>
                                    <SelectItem value="gt">Greater than</SelectItem>
                                    <SelectItem value="lt">Less than</SelectItem>
                                    <SelectItem value="gte">Greater or equal</SelectItem>
                                    <SelectItem value="lte">Less or equal</SelectItem>
                                  </>
                                )}
                                {fieldType === 'date' && (
                                  <>
                                    <SelectItem value="gt">After</SelectItem>
                                    <SelectItem value="lt">Before</SelectItem>
                                    <SelectItem value="gte">On or after</SelectItem>
                                    <SelectItem value="lte">On or before</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeFilter(filter.id)}
                            className="mt-6"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Value Selection Row */}
                        {filter.field && (
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">
                              Value {selectedField?.example && (
                                <span className="text-blue-600 font-normal">
                                  (e.g., {selectedField.example})
                                </span>
                              )}
                            </Label>
                            
                            {fieldType === 'select' ? (
                              <div className="flex gap-2">
                                <Select 
                                  value={filter.value} 
                                  onValueChange={(value) => updateFilter(filter.id, { value })}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select value..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedField?.options?.map(option => (
                                      <SelectItem key={option} value={option}>
                                        <div className="flex items-center gap-2">
                                          {option}
                                          <Badge variant="secondary" className="text-xs capitalize">
                                            {option}
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center text-xs text-gray-500">
                                  or
                                </div>
                                <Input
                                  placeholder="Custom value"
                                  value={selectedField?.options?.includes(filter.value) ? "" : filter.value}
                                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                  className="flex-1"
                                />
                              </div>
                            ) : fieldType === 'boolean' ? (
                              <Select 
                                value={filter.value} 
                                onValueChange={(value) => updateFilter(filter.id, { value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select true or false..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">
                                    <div className="flex items-center gap-2">
                                      True
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                        Yes
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="false">
                                    <div className="flex items-center gap-2">
                                      False
                                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                        No
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={filter.value}
                                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                placeholder={
                                  fieldType === 'number' ? "Enter number..." :
                                  fieldType === 'date' ? "YYYY-MM-DD" :
                                  fieldType === 'text' ? `Enter ${filter.field}...` :
                                  "Enter value..."
                                }
                                type={fieldType === 'number' ? 'number' : 
                                      fieldType === 'date' ? 'date' : 'text'}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {filters.length === 0 && (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p className="text-sm">No filters added yet</p>
                    <p className="text-xs mt-1">Click "Add Filter" above or use a field from the explorer to get started</p>
                  </div>
                )}
              </div>

              <Button onClick={createView} className="w-full">
                Create View
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {/* Saved Views */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Views</CardTitle>
            </CardHeader>
            <CardContent>
              {views.length > 0 ? (
                <div className="space-y-2">
                  {views.map((view: any) => (
                    <Button
                      key={view.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => executeView(view)}
                    >
                      {view.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No saved views yet</p>
              )}
            </CardContent>
          </Card>

          {/* Field Reference (Collapsible) */}
          <Collapsible open={showFieldReference} onOpenChange={setShowFieldReference}>
            <Card className="mt-4">
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0">
                    <CardTitle className="text-sm">Available Fields</CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showFieldReference ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💡 Tip: Click on any field below to add it as a filter
                    </div>
                    
                    {Object.entries(fieldDefinitions).map(([entity, fields]) => (
                      <div key={entity}>
                        <h4 className="font-medium text-sm mb-2 capitalize flex items-center gap-2">
                          {entity}
                          <Badge variant="outline" className="text-xs">
                            {fields.length} fields
                          </Badge>
                        </h4>
                        <div className="grid grid-cols-1 gap-1">
                          {fields.map(field => (
                            <Button
                              key={field.name}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (entity === selectedEntity) {
                                  const newFilter = {
                                    id: Date.now(),
                                    field: field.name,
                                    operator: "equals",
                                    value: ""
                                  };
                                  setFilters([...filters, newFilter]);
                                } else {
                                  setSelectedEntity(entity);
                                  setTimeout(() => {
                                    const newFilter = {
                                      id: Date.now(),
                                      field: field.name,
                                      operator: "equals",
                                      value: ""
                                    };
                                    setFilters([newFilter]);
                                  }, 100);
                                }
                                setShowFieldReference(false);
                              }}
                              className="justify-start h-auto p-2 text-left hover:bg-blue-50"
                              disabled={entity !== selectedEntity}
                            >
                              <div className="text-xs w-full">
                                <div className="flex items-center gap-2 justify-between">
                                  <span className="font-mono">{field.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {field.type}
                                  </Badge>
                                </div>
                                <p className="text-gray-500 ml-0 truncate">{field.description}</p>
                                {field.example && (
                                  <p className="text-blue-600 ml-0 truncate">e.g., {field.example}</p>
                                )}
                              </div>
                            </Button>
                          ))}
                        </div>
                        {entity !== selectedEntity && (
                          <p className="text-xs text-gray-400 mt-1">
                            Switch to {entity} data source to use these fields
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>

      {/* View Results */}
      {selectedView && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{(selectedView as any).name} Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : viewData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr>
                      {Object.keys(viewData[0]).map(key => (
                        <th key={key} className="border p-2 text-left bg-gray-50">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewData.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="border p-2">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data found matching the criteria
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
