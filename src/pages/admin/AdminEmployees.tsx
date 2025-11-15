
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/shared/FormDialog";
import { useState } from "react";
import { AddEmployeeForm } from "@/components/forms/AddEmployeeForm";
import { useEmployees } from "@/hooks/useEmployees";
import { Search, Edit, Eye, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminEmployees = () => {
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showViewEmployee, setShowViewEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { employees, isLoading } = useEmployees();

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setShowEditEmployee(true);
  };

  const handleViewEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setShowViewEmployee(true);
  };

  const handleCloseEditModal = () => {
    setShowEditEmployee(false);
    setSelectedEmployee(null);
  };

  const handleCloseViewModal = () => {
    setShowViewEmployee(false);
    setSelectedEmployee(null);
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp => {
    const query = searchQuery.toLowerCase();
    return (
      emp.fullName?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.employeeId?.toLowerCase().includes(query) ||
      emp.department?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ca-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-ca-blue/10 to-transparent">
          <div>
            <CardTitle className="text-2xl text-ca-blue-dark">Employee Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage employee accounts and permissions
            </p>
          </div>
          <Button 
            onClick={() => setShowAddEmployee(true)}
            className="bg-ca-blue hover:bg-ca-blue-dark"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, employee ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredEmployees.length} of {employees.length} employees
            </div>
          </div>

          {/* Employee Table */}
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery ? 'No employees found matching your search' : 'No employees found'}
              </div>
              {!searchQuery && (
                <Button 
                  onClick={() => setShowAddEmployee(true)}
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Employee
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                              {getInitials(employee.fullName || employee.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.fullName || 'No name set'}</div>
                            <div className="text-sm text-muted-foreground">{employee.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {employee.employeeId || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{employee.department || 'General'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEmployee(employee)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <FormDialog
        open={showAddEmployee}
        onOpenChange={setShowAddEmployee}
        title="Add New Employee"
        description="Create a new employee account"
        showFooter={false}
      >
        <AddEmployeeForm onSuccess={() => setShowAddEmployee(false)} />
      </FormDialog>

      {/* View Employee Modal */}
      <FormDialog
        open={showViewEmployee}
        onOpenChange={handleCloseViewModal}
        title="Employee Details"
        description="View employee information"
        showFooter={false}
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-lg">
                  {getInitials(selectedEmployee.fullName || selectedEmployee.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{selectedEmployee.fullName || 'No name set'}</h3>
                <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-gray-700">Employee ID</label>
                <p className="text-gray-600">{selectedEmployee.employeeId || 'Not set'}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge variant={selectedEmployee.isActive ? "default" : "secondary"}>
                    {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
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
                <label className="font-medium text-gray-700">Joined Date</label>
                <p className="text-gray-600">
                  {selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
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
    </div>
  );
};

export default AdminEmployees;
