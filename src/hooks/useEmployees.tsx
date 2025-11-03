
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getValidatedToken } from '@/lib/auth';

interface Employee {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  department?: string;
  expertise?: string[];
  salary?: number;
  employeeId?: string;
  isActive: boolean;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateEmployeeData {
  email: string;
  fullName: string;
  role: 'employee' | 'admin' | 'owner';
  department?: string;
  salary?: number;
  password: string;
}

const API_BASE = 'http://localhost:3001/api';

export const useEmployees = () => {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        console.log('Fetching employees from backend...');
        
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication Error: Your session has expired. Please log in again.');
        }

        // Get all users, we'll filter for employees and admins on frontend
        // Use a high limit to get all users at once for employee management
        const response = await fetch(`${API_BASE}/users?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log('Raw API response:', result);
        console.log('Total users from API:', result.data?.users?.length || 0);
        console.log('Pagination info:', result.data?.pagination);
        
        // Filter for employees, admins, and owners (exclude superadmin and client roles)
        const allUsers = result.data?.users || [];
        const staffUsers = allUsers.filter((user: any) => 
          user.role === 'employee' || user.role === 'admin' || user.role === 'owner'
        );
        
        console.log('All users:', allUsers.length);
        console.log('Filtered staff users (employees, admins, owners):', staffUsers.length);
        console.log('Staff sample data:', staffUsers[0]);
        
        // Log some employee IDs to debug
        const employeeIds = staffUsers.map(emp => emp.employeeId).filter(Boolean).sort();
        console.log('Employee IDs found:', employeeIds);
        
        // Log roles breakdown
        const roleCount = staffUsers.reduce((acc: any, user: any) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        console.log('Role breakdown:', roleCount);
        
        return staffUsers;
      } catch (err) {
        console.error('Employees fetch error:', err);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('Authentication failed')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const addEmployee = useMutation({
    mutationFn: async (employeeData: CreateEmployeeData) => {
      try {
        console.log('Adding employee to backend:', employeeData);
        
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication Error: Your session has expired. Please log in again.');
        }
        
        const response = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(employeeData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create employee');
        }

        const result = await response.json();
        console.log('Employee added successfully:', result.data?.user);
        return result.data?.user;
      } catch (err) {
        console.error('Employee add error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log('Invalidating employees query...');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const bulkDeleteEmployees = useMutation({
    mutationFn: async (userIds: string[]) => {
      try {
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication Error: Your session has expired. Please log in again.');
        }
        
        const response = await fetch(`${API_BASE}/users/bulk-delete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete employees');
        }

        const result = await response.json();
        return result.data;
      } catch (err) {
        console.error('Bulk delete employees error:', err);
        throw err;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Successfully deleted ${result.deletedCount} employees`);
    },
    onError: () => {
      toast.error('Failed to delete employees');
    },
  });

  const bulkUpdateEmployeeStatus = useMutation({
    mutationFn: async ({ userIds, isActive }: { userIds: string[]; isActive: boolean }) => {
      try {
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication Error: Your session has expired. Please log in again.');
        }
        
        const response = await fetch(`${API_BASE}/users/bulk-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds, isActive }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update employee status');
        }

        const result = await response.json();
        return result.data;
      } catch (err) {
        console.error('Bulk update status error:', err);
        throw err;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Successfully updated status for ${result.updatedCount} employees`);
    },
    onError: () => {
      toast.error('Failed to update employee status');
    },
  });

  const bulkUpdateEmployeeDepartment = useMutation({
    mutationFn: async ({ userIds, department }: { userIds: string[]; department: string }) => {
      try {
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication Error: Your session has expired. Please log in again.');
        }
        
        const response = await fetch(`${API_BASE}/users/bulk-department`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds, department }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update employee department');
        }

        const result = await response.json();
        return result.data;
      } catch (err) {
        console.error('Bulk update department error:', err);
        throw err;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Successfully updated department for ${result.updatedCount} employees`);
    },
    onError: () => {
      toast.error('Failed to update employee department');
    },
  });

  const bulkImportEmployees = useMutation({
    mutationFn: async (employeesData: Array<Record<string, unknown>>) => {
      try {
        const token = getValidatedToken();
        if (!token) {
          throw new Error('Authentication Error: Your session has expired. Please log in again.');
        }
        
        const response = await fetch(`${API_BASE}/users/bulk-import`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ users: employeesData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to import employees');
        }

        const result = await response.json();
        return result.data;
      } catch (err) {
        console.error('Bulk import error:', err);
        throw err;
      }
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      const { successful = [], failed = [], duplicates = [] } = results;
      
      if (successful.length > 0) {
        toast.success(`Successfully imported ${successful.length} employees`);
      }
      
      if (duplicates.length > 0) {
        toast.warning(`${duplicates.length} employees were skipped (duplicates found)`);
      }
      
      if (failed.length > 0) {
        toast.error(`${failed.length} employees failed to import`);
      }
      
      if (successful.length === 0 && duplicates.length === 0 && failed.length === 0) {
        toast.info('No employees were processed');
      }
    },
    onError: () => {
      toast.error('Failed to import employees');
    },
  });

  return {
    employees,
    isLoading,
    error,
    addEmployee: addEmployee.mutate,
    bulkImportEmployees: bulkImportEmployees.mutate,
    bulkDeleteEmployees: bulkDeleteEmployees.mutate,
    bulkUpdateEmployeeStatus: bulkUpdateEmployeeStatus.mutate,
    bulkUpdateEmployeeDepartment: bulkUpdateEmployeeDepartment.mutate,
    isAdding: addEmployee.isPending,
    isImporting: bulkImportEmployees.isPending,
    isBulkDeleting: bulkDeleteEmployees.isPending,
    isBulkUpdatingStatus: bulkUpdateEmployeeStatus.isPending,
    isBulkUpdatingDepartment: bulkUpdateEmployeeDepartment.isPending,
  };
};
