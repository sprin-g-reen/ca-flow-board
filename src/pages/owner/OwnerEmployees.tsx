
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { PlusSquare, Search, UserPlus } from 'lucide-react';
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
  const { employees, isLoading } = useEmployees();
  
  const [activeTab, setActiveTab] = useState('employees');

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

  // Filter employees and admins
  const employeeList = employees.filter(emp => emp.profiles?.role === 'employee');
  const adminList = employees.filter(emp => emp.profiles?.role === 'superadmin');

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
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="admins">Administrators</TabsTrigger>
            </TabsList>

            <div className="flex justify-between items-center my-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder={`Search ${activeTab}`} className="pl-8" />
              </div>
              <Button 
                className="bg-ca-blue hover:bg-ca-blue-dark"
                onClick={handleOpenAddEmployeeModal}
              >
                {activeTab === "employees" ? (
                  <UserPlus className="mr-2 h-4 w-4" />
                ) : (
                  <PlusSquare className="mr-2 h-4 w-4" />
                )}
                Add {activeTab === "employees" ? "Employee" : "Admin"}
              </Button>
            </div>

            <TabsContent value="employees">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeList.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-ca-blue text-white">
                              {employee.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'E'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.profiles?.full_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.position || 'Not assigned'}</TableCell>
                      <TableCell>{employee.profiles?.email}</TableCell>
                      <TableCell>{employee.department || 'General'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          employee.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employeeList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No employees found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="admins">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminList.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-ca-blue-dark text-white">
                              {admin.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{admin.profiles?.full_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.profiles?.role}</TableCell>
                      <TableCell>{admin.profiles?.email}</TableCell>
                      <TableCell>{admin.department || 'Administration'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          admin.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {adminList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No administrators found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
          
          <FormDialog
            open={modals.addEmployee}
            onOpenChange={handleCloseAddEmployeeModal}
            title="Add New Employee"
            description="Create a new employee record for your firm"
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
