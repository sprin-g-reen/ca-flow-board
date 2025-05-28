
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { PlusSquare, Search, UserPlus, AlertCircle } from 'lucide-react';
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
import { toggleModal } from '@/store/slices/uiSlice';
import { useEmployees } from '@/hooks/useEmployees';

const OwnerEmployees = () => {
  const dispatch = useDispatch();
  const { modals } = useSelector((state: RootState) => state.ui);
  const { employees, isLoading, error } = useEmployees();
  
  const [activeTab, setActiveTab] = useState('employees');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAddEmployeeModal = () => {
    dispatch(toggleModal({ modal: 'addEmployee', value: true }));
  };
  
  const handleCloseAddEmployeeModal = () => {
    dispatch(toggleModal({ modal: 'addEmployee', value: false }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ca-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Employees</h3>
          <p className="text-gray-600">Failed to load employee data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Filter employees and admins
  const employeeList = employees.filter((emp: any) => 
    emp.profiles?.role === 'employee' || !emp.profiles?.role
  );
  const adminList = employees.filter((emp: any) => 
    emp.profiles?.role === 'superadmin'
  );

  // Filter based on search query
  const filteredEmployees = employeeList.filter((emp: any) =>
    emp.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdmins = adminList.filter((emp: any) =>
    emp.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Button 
                className="bg-ca-blue hover:bg-ca-blue-dark"
                onClick={handleOpenAddEmployeeModal}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add {activeTab === "employees" ? "Employee" : "Admin"}
              </Button>
            </div>

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee: any) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-ca-blue text-white">
                                {employee.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || employee.employee_id?.slice(0, 2) || 'E'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">
                                {employee.profiles?.full_name || 'No name set'}
                              </span>
                              {employee.profiles?.email && (
                                <div className="text-xs text-gray-500">
                                  {employee.profiles.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.employee_id}</TableCell>
                        <TableCell>{employee.position || 'Not assigned'}</TableCell>
                        <TableCell>{employee.department || 'General'}</TableCell>
                        <TableCell>
                          {employee.profiles ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Account Created
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pending Signup
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'secondary' : 'destructive'} 
                                 className={employee.status === 'active' 
                                   ? 'bg-green-100 text-green-800' 
                                   : 'bg-red-100 text-red-800'
                                 }>
                            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((admin: any) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-ca-blue-dark text-white">
                                {admin.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || admin.employee_id?.slice(0, 2) || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">
                                {admin.profiles?.full_name || 'No name set'}
                              </span>
                              {admin.profiles?.email && (
                                <div className="text-xs text-gray-500">
                                  {admin.profiles.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{admin.employee_id}</TableCell>
                        <TableCell>{admin.position || 'Not assigned'}</TableCell>
                        <TableCell>{admin.department || 'Administration'}</TableCell>
                        <TableCell>
                          {admin.profiles ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Account Created
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pending Signup
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={admin.status === 'active' ? 'secondary' : 'destructive'} 
                                 className={admin.status === 'active' 
                                   ? 'bg-green-100 text-green-800' 
                                   : 'bg-red-100 text-red-800'
                                 }>
                            {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
          
          <FormDialog
            open={modals.addEmployee}
            onOpenChange={handleCloseAddEmployeeModal}
            title={`Add New ${activeTab === "employees" ? "Employee" : "Administrator"}`}
            description={`Create a new ${activeTab === "employees" ? "employee" : "administrator"} record for your firm`}
            showFooter={false}
          >
            <AddEmployeeForm onSuccess={handleCloseAddEmployeeModal} />
          </FormDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerEmployees;
