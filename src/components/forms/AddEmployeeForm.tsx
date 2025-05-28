
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

const formSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(['employee', 'superadmin'], {
    required_error: "Please select a role",
  }),
  position: z.string().min(2, "Position is required"),
  department: z.string().optional(),
  salary: z.number().optional(),
});

export function AddEmployeeForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addEmployee } = useEmployees();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'employee',
      position: '',
      department: 'General',
      salary: undefined,
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log('Creating employee with values:', values);
      
      // Generate employee ID
      const employee_id = `EMP${Date.now()}`;
      
      const employeeData = {
        employee_id,
        position: values.position,
        department: values.department || 'General',
        salary: values.salary || null,
        status: 'active' as const,
        // Note: user_id will be set when the user actually signs up with this email
        // For now we're creating the employee record without linking to a user
      };

      await addEmployee(employeeData);
      
      // Also create a profile record for this employee
      // This will be used when they sign up
      console.log('Employee created successfully');
      toast.success("Employee record created successfully. They can now sign up with this email.");
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error("Failed to create employee record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRole = form.watch('role');
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email address" type="email" {...field} />
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
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="superadmin">Super Administrator</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {selectedRole === 'superadmin' ? (
                    <>
                      <SelectItem value="Chief Operating Officer">Chief Operating Officer</SelectItem>
                      <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                      <SelectItem value="Senior Manager">Senior Manager</SelectItem>
                      <SelectItem value="Department Head">Department Head</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Senior Accountant">Senior Accountant</SelectItem>
                      <SelectItem value="Junior Accountant">Junior Accountant</SelectItem>
                      <SelectItem value="GST Specialist">GST Specialist</SelectItem>
                      <SelectItem value="Tax Consultant">Tax Consultant</SelectItem>
                      <SelectItem value="Auditor">Auditor</SelectItem>
                      <SelectItem value="Assistant">Assistant</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Taxation">Taxation</SelectItem>
                  <SelectItem value="Audit">Audit</SelectItem>
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="ITR">ITR</SelectItem>
                  <SelectItem value="ROC">ROC</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
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
              <FormLabel>Monthly Salary (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter monthly salary" 
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="pt-4 space-x-2 flex justify-end">
          <Button 
            type="submit" 
            className="bg-ca-blue hover:bg-ca-blue-dark"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Employee"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
