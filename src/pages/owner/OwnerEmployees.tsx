import { useState } from 'react';
import { PlusSquare, Search, UserPlus, AlertCircle, Download, Upload, MessageSquare, Check, X, Eye, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FormDialog } from '@/components/shared/FormDialog';
import { AddEmployeeForm } from '@/components/forms/AddEmployeeForm';
import { DirectMessage } from '@/components/communication/DirectMessage';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from 'sonner';

const OwnerEmployees = () => {
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showViewEmployee, setShowViewEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showMessageEmployee, setShowMessageEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  // Bulk selection state
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  
  const { 
    employees, 
    isLoading, 
    error,
    bulkImportEmployees,
    bulkDeleteEmployees,
    bulkUpdateEmployeeStatus,
    bulkUpdateEmployeeDepartment,
    isImporting,
    isBulkDeleting,
    isBulkUpdatingStatus,
    isBulkUpdatingDepartment
  } = useEmployees();
  
  const [activeTab, setActiveTab] = useState('employees');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAddEmployeeModal = () => {
    setShowAddEmployee(true);
  };
  
  const handleCloseAddEmployeeModal = () => {
    setShowAddEmployee(false);
  };

  // Bulk selection handlers
  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (checked: boolean, filteredList: any[]) => {
    if (checked) {
      setSelectedEmployees(filteredList.map(emp => emp._id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select employees first');
      return;
    }

    const selectedCount = selectedEmployees.length;
    let confirmTitle = '';
    let confirmText = '';
    let confirmAction = '';

    switch (action) {
      case 'delete':
        confirmTitle = 'Delete Employees';
        confirmText = `Are you sure you want to delete ${selectedCount} selected employees? This action cannot be undone.`;
        confirmAction = 'Yes, Delete';
        break;
      case 'activate':
        confirmTitle = 'Activate Employees';
        confirmText = `Set ${selectedCount} selected employees to Active status?`;
        confirmAction = 'Yes, Activate';
        break;
      case 'deactivate':
        confirmTitle = 'Deactivate Employees';
        confirmText = `Set ${selectedCount} selected employees to Inactive status?`;
        confirmAction = 'Yes, Deactivate';
        break;
      case 'taxation':
      case 'audit':
      case 'administration':
        confirmTitle = 'Update Department';
        confirmText = `Move ${selectedCount} selected employees to ${action} department?`;
        confirmAction = 'Yes, Update';
        break;
      default:
        return;
    }

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'delete' ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmAction,
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        switch (action) {
          case 'delete':
            await bulkDeleteEmployees(selectedEmployees);
            break;
          case 'activate':
            await bulkUpdateEmployeeStatus({ userIds: selectedEmployees, isActive: true });
            break;
          case 'deactivate':
            await bulkUpdateEmployeeStatus({ userIds: selectedEmployees, isActive: false });
            break;
          case 'taxation':
          case 'audit':
          case 'administration':
            await bulkUpdateEmployeeDepartment({ userIds: selectedEmployees, department: action });
            break;
        }
        setSelectedEmployees([]);
        setBulkAction('');
      } catch (error) {
        console.error('Bulk action error:', error);
      }
    }
  };

  const handleViewEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setShowViewEmployee(true);
  };

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setShowEditEmployee(true);
  };

  const handleCloseViewModal = () => {
    setShowViewEmployee(false);
    setSelectedEmployee(null);
  };

  const handleCloseEditModal = () => {
    setShowEditEmployee(false);
    setSelectedEmployee(null);
  };

  const handleMessageEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setShowMessageEmployee(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageEmployee(false);
    setSelectedEmployee(null);
  };

  const handleExportEmployees = () => {
    try {
      const exportData = employees.map(emp => ({
        employee_id: emp.employeeId,
        name: emp.fullName || 'No name set',
        email: emp.email || 'No email',
        role: emp.role || 'employee',
        department: emp.department || 'General',
        salary: emp.salary || 'Not set',
        status: emp.isActive ? 'Active' : 'Inactive',
        created_at: emp.createdAt,
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Employees exported successfully');
    } catch (error) {
      toast.error('Failed to export employees');
    }
  };

  const downloadExcelTemplate = () => {
    const templateData = [{
      email: 'employee@example.com',
      fullName: 'John Doe',
      role: 'employee',
      phone: '+91 0000000000',
      department: 'taxation',
      salary: '50000',
      password: 'ChangeMe@123'
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees Template');
    
    // Auto-size columns
    const cols = Object.keys(templateData[0]).map(() => ({ width: 20 }));
    worksheet['!cols'] = cols;
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `employees-import-template-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success('Excel template downloaded successfully');
  };

  const handleImportEmployees = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => handleExcelUpload(e as any);
    input.click();
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, any>>;

      if (jsonData.length === 0) {
        toast.error('Excel file is empty');
        return;
      }

      // Validate and process the data
      const validEmployees: any[] = [];
      const errors: string[] = [];

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // Excel row number (accounting for header)
        
        if (!row.email || !row.fullName) {
          errors.push(`Row ${rowNumber}: Email and full name are required`);
          return;
        }

        if (!isValidEmail(row.email)) {
          errors.push(`Row ${rowNumber}: Invalid email format`);
          return;
        }

        // Validate role
        const validRoles = ['employee', 'admin', 'owner'];
        const role = row.role?.toLowerCase() || 'employee';
        if (!validRoles.includes(role)) {
          errors.push(`Row ${rowNumber}: Invalid role. Must be employee, admin, or owner`);
          return;
        }

        validEmployees.push({
          email: row.email,
          fullName: row.fullName,
          role: role,
          phone: row.phone || '',
          department: row.department || 'general',
          salary: row.salary || null,
          password: row.password || 'ChangeMe@123',
          isActive: true
        });
      });

      if (errors.length > 0) {
        Swal.fire({
          title: 'Validation Errors',
          html: `<div class="text-left"><ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul></div>`,
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      // Confirm import
      const confirmResult = await Swal.fire({
        title: 'Confirm Import',
        text: `Ready to import ${validEmployees.length} employees. Continue?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Import',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280'
      });

      if (confirmResult.isConfirmed) {
        bulkImportEmployees(validEmployees);
      }

    } catch (error) {
      toast.error('Failed to process Excel file');
      console.error('Excel upload error:', error);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ca-blue"></div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load employee data';
    const isAuthError = errorMessage.includes('Authentication failed');
    
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            {isAuthError ? 'Authentication Error' : 'Error Loading Employees'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isAuthError 
              ? 'Your session has expired. Please log in again.' 
              : errorMessage
            }
          </p>
          <div className="space-x-2">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Refresh Page
            </Button>
            {isAuthError && (
              <Button 
                onClick={() => window.location.href = '/login'} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Login Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter employees, admins, and owners based on their role
  const employeeList = employees.filter((emp: any) => 
    emp.role === 'employee'
  );
  
  const adminList = employees.filter((emp: any) => 
    emp.role === 'admin'
  );
  
  const ownerList = employees.filter((emp: any) => 
    emp.role === 'owner'
  );

  // Filter based on search query
  const filteredEmployees = employeeList.filter((emp: any) =>
    emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a: any, b: any) => {
    // Sort by employee ID (numeric part)
    const aId = a.employeeId ? parseInt(a.employeeId.replace('EMP', '')) : 0;
    const bId = b.employeeId ? parseInt(b.employeeId.replace('EMP', '')) : 0;
    return aId - bId;
  });

  const filteredAdmins = adminList.filter((emp: any) =>
    emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a: any, b: any) => {
    // Sort by employee ID (numeric part)
    const aId = a.employeeId ? parseInt(a.employeeId.replace('EMP', '')) : 0;
    const bId = b.employeeId ? parseInt(b.employeeId.replace('EMP', '')) : 0;
    return aId - bId;
  });

  const filteredOwners = ownerList.filter((emp: any) =>
    emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a: any, b: any) => {
    // Sort by created date
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Team Management</CardTitle>
          <CardDescription>
            Manage your firm's staff and administrative team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="employees" className="mb-6" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="employees">
                Employees ({employeeList.length})
              </TabsTrigger>
              <TabsTrigger value="admins">
                Administrators ({adminList.length})
              </TabsTrigger>
              <TabsTrigger value="owners">
                Owners ({ownerList.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex justify-between items-center my-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={`Search ${activeTab}`} 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={downloadExcelTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleImportEmployees}
                  disabled={isImporting}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportEmployees}
                  disabled={employees.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button 
                  className="bg-ca-blue hover:bg-ca-blue-dark"
                  onClick={handleOpenAddEmployeeModal}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add {activeTab === "employees" ? "Employee" : activeTab === "admins" ? "Admin" : "Owner"}
                </Button>
              </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedEmployees.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-blue-800 font-medium">
                    {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choose action..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activate">Set Active</SelectItem>
                        <SelectItem value="deactivate">Set Inactive</SelectItem>
                        <SelectItem value="taxation">Move to Taxation</SelectItem>
                        <SelectItem value="audit">Move to Audit</SelectItem>
                        <SelectItem value="administration">Move to Administration</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => handleBulkAction(bulkAction)}
                      disabled={!bulkAction || isBulkDeleting || isBulkUpdatingStatus || isBulkUpdatingDepartment}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {(isBulkDeleting || isBulkUpdatingStatus || isBulkUpdatingDepartment) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Apply
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedEmployees([]);
                    setBulkAction('');
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Selection
                </Button>
              </div>
            )}

            <TabsContent value="employees">
              {filteredEmployees.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {searchQuery ? 'No employees found' : 'No employees yet'}
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {searchQuery 
                        ? 'Try adjusting your search terms to find employees.'
                        : 'Get started by adding your first employee to the system.'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 sticky left-0 bg-white z-10 border-r border-gray-200">
                            <Checkbox
                              checked={
                                filteredEmployees.length > 0 && 
                                selectedEmployees.length === filteredEmployees.length
                              }
                              onCheckedChange={(checked) => handleSelectAll(checked as boolean, filteredEmployees)}
                              aria-label="Select all employees"
                            />
                          </TableHead>
                          <TableHead className="w-64 text-xs font-medium">Employee</TableHead>
                          <TableHead className="w-24 text-xs font-medium">Username</TableHead>
                          <TableHead className="w-24 text-xs font-medium">Employee ID</TableHead>
                          <TableHead className="w-32 text-xs font-medium">Department</TableHead>
                          <TableHead className="w-28 text-xs font-medium">Salary</TableHead>
                          <TableHead className="w-20 text-xs font-medium">Status</TableHead>
                          <TableHead className="w-28 text-right text-xs font-medium sticky right-0 bg-white z-10 border-l border-gray-200">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee: any) => (
                          <TableRow key={employee._id} className="hover:bg-gray-50/80">
                            <TableCell className="sticky left-0 bg-white z-10 border-r border-gray-100">
                              <Checkbox
                                checked={selectedEmployees.includes(employee._id)}
                                onCheckedChange={(checked) => handleSelectEmployee(employee._id, checked as boolean)}
                                aria-label={`Select ${employee.fullName || employee.email}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                  <AvatarFallback className="bg-ca-blue text-white text-xs">
                                    {employee.fullName?.split(' ').map((n: string) => n[0]).join('') || employee.employeeId?.slice(0, 2) || 'E'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-xs truncate" title={employee.fullName || 'No name set'}>
                                    {employee.fullName || 'No name set'}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate" title={employee.email}>
                                    {employee.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="truncate pr-2 text-gray-600 font-mono" title={employee.username}>
                                {employee.username || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="truncate pr-2" title={employee.employeeId}>
                                {employee.employeeId}
                              </div>
                            </TableCell>
                            <TableCell className="capitalize text-xs">
                              <div className="truncate pr-2" title={employee.department || 'General'}>
                                {employee.department || 'General'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="truncate pr-2" title={employee.salary ? `₹${employee.salary.toLocaleString()}` : 'Not set'}>
                                {employee.salary ? `₹${employee.salary.toLocaleString()}` : 'Not set'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={employee.isActive ? 'secondary' : 'destructive'} 
                                     className={`text-xs px-1 py-0 ${employee.isActive 
                                       ? 'bg-green-100 text-green-800' 
                                       : 'bg-red-100 text-red-800'
                                     }`}>
                                {employee.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right sticky right-0 bg-white z-10 border-l border-gray-100">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewEmployee(employee)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-7 w-7 p-0"
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleMessageEmployee(employee)}
                                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 h-7 w-7 p-0"
                                  title="Send Message"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditEmployee(employee)}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50 h-7 w-7 p-0"
                                  title="Edit"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              {filteredEmployees.length > 0 && (
                <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                  <span>
                    Showing {filteredEmployees.length} of {employeeList.length} employees
                    {searchQuery && ` (filtered by "${searchQuery}")`}
                  </span>
                  <span className="text-xs">
                    Total users in system: {employees.length}
                  </span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="admins">
              {filteredAdmins.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <PlusSquare className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {searchQuery ? 'No administrators found' : 'No administrators yet'}
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {searchQuery 
                        ? 'Try adjusting your search terms to find administrators.'
                        : 'Add your first super administrator to help manage the system.'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 sticky left-0 bg-white z-10 border-r border-gray-200">
                            <Checkbox
                              checked={
                                filteredAdmins.length > 0 && 
                                selectedEmployees.length === filteredAdmins.length
                              }
                              onCheckedChange={(checked) => handleSelectAll(checked as boolean, filteredAdmins)}
                              aria-label="Select all admins"
                            />
                          </TableHead>
                          <TableHead className="w-64 text-xs font-medium">Admin</TableHead>
                          <TableHead className="w-24 text-xs font-medium">Employee ID</TableHead>
                          <TableHead className="w-32 text-xs font-medium">Department</TableHead>
                          <TableHead className="w-28 text-xs font-medium">Salary</TableHead>
                          <TableHead className="w-20 text-xs font-medium">Status</TableHead>
                          <TableHead className="w-28 text-right text-xs font-medium sticky right-0 bg-white z-10 border-l border-gray-200">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdmins.map((admin: any) => (
                          <TableRow key={admin._id} className="hover:bg-gray-50/80">
                            <TableCell className="sticky left-0 bg-white z-10 border-r border-gray-100">
                              <Checkbox
                                checked={selectedEmployees.includes(admin._id)}
                                onCheckedChange={(checked) => handleSelectEmployee(admin._id, checked as boolean)}
                                aria-label={`Select ${admin.fullName || admin.email}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                  <AvatarFallback className="bg-ca-blue-dark text-white text-xs">
                                    {admin.fullName?.split(' ').map((n: string) => n[0]).join('') || admin.employeeId?.slice(0, 2) || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-xs truncate" title={admin.fullName || 'No name set'}>
                                    {admin.fullName || 'No name set'}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate" title={admin.email}>
                                    {admin.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="truncate pr-2" title={admin.employeeId}>
                                {admin.employeeId}
                              </div>
                            </TableCell>
                            <TableCell className="capitalize text-xs">
                              <div className="truncate pr-2" title={admin.department || 'Administration'}>
                                {admin.department || 'Administration'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="truncate pr-2" title={admin.salary ? `₹${admin.salary.toLocaleString()}` : 'Not set'}>
                                {admin.salary ? `₹${admin.salary.toLocaleString()}` : 'Not set'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={admin.isActive ? 'secondary' : 'destructive'} 
                                     className={`text-xs px-1 py-0 ${admin.isActive 
                                       ? 'bg-green-100 text-green-800' 
                                       : 'bg-red-100 text-red-800'
                                     }`}>
                                {admin.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right sticky right-0 bg-white z-10 border-l border-gray-100">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewEmployee(admin)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-7 w-7 p-0"
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleMessageEmployee(admin)}
                                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 h-7 w-7 p-0"
                                  title="Send Message"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditEmployee(admin)}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50 h-7 w-7 p-0"
                                  title="Edit"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              {filteredAdmins.length > 0 && (
                <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                  <span>
                    Showing {filteredAdmins.length} of {adminList.length} administrators
                    {searchQuery && ` (filtered by "${searchQuery}")`}
                  </span>
                  <span className="text-xs">
                    Total users in system: {employees.length}
                  </span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="owners">
              {filteredOwners.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <PlusSquare className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {searchQuery ? 'No owners found' : 'No owners yet'}
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {searchQuery 
                        ? 'Try adjusting your search terms to find owners.'
                        : 'Owners are automatically added during firm setup.'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 sticky left-0 bg-white z-10 border-r border-gray-200">
                            <Checkbox
                              checked={
                                filteredOwners.length > 0 && 
                                selectedEmployees.length === filteredOwners.length
                              }
                              onCheckedChange={(checked) => handleSelectAll(checked as boolean, filteredOwners)}
                              aria-label="Select all owners"
                            />
                          </TableHead>
                          <TableHead className="w-64 text-xs font-medium">Owner</TableHead>
                          <TableHead className="w-24 text-xs font-medium">Employee ID</TableHead>
                          <TableHead className="w-32 text-xs font-medium">Department</TableHead>
                          <TableHead className="w-28 text-xs font-medium">Salary</TableHead>
                          <TableHead className="w-20 text-xs font-medium">Status</TableHead>
                          <TableHead className="w-28 text-right text-xs font-medium sticky right-0 bg-white z-10 border-l border-gray-200">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOwners.map((owner: any) => (
                          <TableRow key={owner._id} className="hover:bg-gray-50/80">
                            <TableCell className="sticky left-0 bg-white z-10 border-r border-gray-100">
                              <Checkbox
                                checked={selectedEmployees.includes(owner._id)}
                                onCheckedChange={(checked) => handleSelectEmployee(owner._id, checked as boolean)}
                                aria-label={`Select ${owner.fullName || owner.email}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                  <AvatarFallback className="bg-purple-600 text-white text-xs">
                                    {owner.fullName?.split(' ').map((n: string) => n[0]).join('') || owner.employeeId?.slice(0, 2) || 'O'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-xs truncate" title={owner.fullName || 'No name set'}>
                                    {owner.fullName || 'No name set'}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate" title={owner.email}>
                                    {owner.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="truncate pr-2" title={owner.employeeId}>
                                {owner.employeeId || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="capitalize text-xs">
                              <div className="truncate pr-2" title={owner.department || 'Management'}>
                                {owner.department || 'Management'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="truncate pr-2" title={owner.salary ? `₹${owner.salary.toLocaleString()}` : 'Not set'}>
                                {owner.salary ? `₹${owner.salary.toLocaleString()}` : 'Not set'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={owner.isActive ? 'secondary' : 'destructive'} 
                                     className={`text-xs px-1 py-0 ${owner.isActive 
                                       ? 'bg-green-100 text-green-800' 
                                       : 'bg-red-100 text-red-800'
                                     }`}>
                                {owner.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right sticky right-0 bg-white z-10 border-l border-gray-100">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewEmployee(owner)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-7 w-7 p-0"
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleMessageEmployee(owner)}
                                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 h-7 w-7 p-0"
                                  title="Send Message"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditEmployee(owner)}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50 h-7 w-7 p-0"
                                  title="Edit"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              {filteredOwners.length > 0 && (
                <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                  <span>
                    Showing {filteredOwners.length} of {ownerList.length} owners
                    {searchQuery && ` (filtered by "${searchQuery}")`}
                  </span>
                  <span className="text-xs">
                    Total users in system: {employees.length}
                  </span>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <FormDialog
            open={showAddEmployee}
            onOpenChange={handleCloseAddEmployeeModal}
            title={`Add New ${activeTab === "employees" ? "Employee" : "Administrator"}`}
            description={`Create a new ${activeTab === "employees" ? "employee" : "administrator"} record for your firm`}
            showFooter={false}
          >
            <AddEmployeeForm onSuccess={handleCloseAddEmployeeModal} />
          </FormDialog>

          {/* View Employee Modal */}
          <FormDialog
            open={showViewEmployee}
            onOpenChange={handleCloseViewModal}
            title="Employee Details"
            description="View employee information and details"
            showFooter={false}
          >
            {selectedEmployee && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-ca-blue text-white text-lg">
                      {selectedEmployee.fullName?.split(' ').map((n: string) => n[0]).join('') || 
                       selectedEmployee.employeeId?.slice(0, 2) || 'E'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedEmployee.fullName || 'No name set'}</h3>
                    <p className="text-gray-600">{selectedEmployee.email}</p>
                    <Badge variant={selectedEmployee.isActive ? 'secondary' : 'destructive'} 
                           className={selectedEmployee.isActive 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-red-100 text-red-800'
                           }>
                      {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-gray-700">Employee ID</label>
                    <p className="text-gray-600">{selectedEmployee.employeeId || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Role</label>
                    <p className="text-gray-600 capitalize">{selectedEmployee.role || 'employee'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Department</label>
                    <p className="text-gray-600 capitalize">{selectedEmployee.department || 'General'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Phone</label>
                    <p className="text-gray-600">{selectedEmployee.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Salary</label>
                    <p className="text-gray-600">
                      {selectedEmployee.salary ? `₹${selectedEmployee.salary.toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Joined Date</label>
                    <p className="text-gray-600">
                      {selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                {selectedEmployee.lastLogin && (
                  <div>
                    <label className="font-medium text-gray-700">Last Login</label>
                    <p className="text-gray-600">
                      {new Date(selectedEmployee.lastLogin).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </FormDialog>

          {/* Edit Employee Modal */}
          <FormDialog
            open={showEditEmployee}
            onOpenChange={handleCloseEditModal}
            title="Edit Employee"
            description="Update employee information and details"
            showFooter={false}
          >
            {selectedEmployee && (
              <AddEmployeeForm 
                onSuccess={handleCloseEditModal} 
                initialData={selectedEmployee}
                isEditing={true}
              />
            )}
          </FormDialog>

          {/* Message Employee Modal */}
          <FormDialog
            open={showMessageEmployee}
            onOpenChange={handleCloseMessageModal}
            title={`Send Message to ${selectedEmployee?.fullName || selectedEmployee?.email || 'Employee'}`}
            description="Send a message or start a conversation"
            showFooter={false}
          >
            {selectedEmployee && (
              <DirectMessage 
                recipientId={selectedEmployee._id}
                recipientName={selectedEmployee.fullName || selectedEmployee.email}
              />
            )}
          </FormDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerEmployees;
