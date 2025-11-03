
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEmployees } from '@/hooks/useEmployees';

interface AddEmployeeFormProps {
  onSuccess: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export function AddEmployeeForm({ onSuccess, initialData, isEditing = false }: AddEmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addEmployee } = useEmployees();
  
  // Create dynamic schema based on whether we're editing or creating
  const createFormSchema = (isEditing: boolean) => {
    return z.object({
      fullName: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Please enter a valid email"),
      role: z.enum(['employee', 'admin', 'owner'], {
        required_error: "Please select a role",
      }),
      department: z.string().optional(),
      salary: z.number().optional(),
      password: isEditing 
        ? z.string().optional()
        : z.string().min(6, "Password must be at least 6 characters"),
    });
  };
  
  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    resolver: zodResolver(createFormSchema(isEditing)),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      role: initialData?.role || 'employee',
      department: initialData?.department || 'general',
      salary: initialData?.salary || undefined,
      password: '',
    },
  });
  
  const onSubmit = async (values: z.infer<ReturnType<typeof createFormSchema>>) => {
    try {
      setIsSubmitting(true);
      console.log(`${isEditing ? 'Updating' : 'Creating'} employee with values:`, values);
      
      const employeeData = {
        email: values.email,
        fullName: values.fullName,
        role: values.role,
        department: values.department || 'general',
        salary: values.salary,
        ...(values.password && { password: values.password }), // Only include password if provided
      };

      if (isEditing && initialData) {
        // TODO: Implement update employee functionality
        // await updateEmployee(initialData._id, employeeData);
        console.log('Employee update functionality not yet implemented');
        toast.success("Employee update functionality coming soon!");
      } else {
        await addEmployee(employeeData);
        toast.success("Employee created successfully. They can now log in with their credentials.");
      }
      
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} employee:`, error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} employee record`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRole = form.watch('role');
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter full name" 
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter email address" 
                    type="email" 
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Password {isEditing && "(Leave blank to keep current password)"}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={isEditing ? "Enter new password (optional)" : "Enter password"} 
                    type="password" 
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="taxation">Taxation</SelectItem>
                    <SelectItem value="audit">Audit</SelectItem>
                    <SelectItem value="advisory">Advisory</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Monthly Salary (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter monthly salary" 
                    type="number"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="pt-6 flex justify-end sticky bottom-0 bg-white border-t border-gray-100 mt-6 -mx-6 px-6 py-4">
          <Button 
            type="submit" 
            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Employee" : "Create Employee")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}