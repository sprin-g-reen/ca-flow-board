
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

const OwnerEmployees = () => {
  const dispatch = useDispatch();
  const { modals } = useSelector((state: RootState) => state.ui);
  
  // In a real app, this would come from the API
  const employees = [
    { id: 301, name: 'Jane Smith', role: 'Senior Accountant', email: 'jane@example.com', phone: '+91 98765 43210', status: 'active' },
    { id: 302, name: 'Mike Brown', role: 'GST Specialist', email: 'mike@example.com', phone: '+91 87654 32109', status: 'active' },
    { id: 303, name: 'Sara Williams', role: 'Auditor', email: 'sara@example.com', phone: '+91 76543 21098', status: 'active' },
    { id: 304, name: 'Alex Johnson', role: 'Junior Accountant', email: 'alex@example.com', phone: '+91 65432 10987', status: 'inactive' },
    { id: 305, name: 'Priya Sharma', role: 'Tax Consultant', email: 'priya@example.com', phone: '+91 54321 09876', status: 'active' },
  ];

  const admins = [
    { id: 201, name: 'David Wilson', role: 'Super Admin', email: 'david@example.com', phone: '+91 98765 12345', status: 'active' },
    { id: 202, name: 'Lisa Chen', role: 'Super Admin', email: 'lisa@example.com', phone: '+91 87654 23456', status: 'active' },
  ];

  const [activeTab, setActiveTab] = useState('employees');

  const handleOpenAddEmployeeModal = () => {
    dispatch(toggleModal({ modal: 'addEmployee', value: true }));
  };
  
  const handleCloseAddEmployeeModal = () => {
    dispatch(toggleModal({ modal: 'addEmployee', value: false }));
  };

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
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-ca-blue text-white">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
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
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-ca-blue-dark text-white">
                              {admin.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.role}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.phone}</TableCell>
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
