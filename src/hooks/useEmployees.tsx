
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  user_id?: string;
  employee_id: string;
  department?: string;
  position?: string;
  salary?: number;
  hire_date?: string;
  status: 'active' | 'inactive' | 'terminated';
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
    email: string;
    role: string;
  };
}

interface CreateEmployeeData {
  employee_id: string;
  department?: string;
  position?: string;
  salary?: number | null;
  status: 'active' | 'inactive' | 'terminated';
}

export const useEmployees = () => {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        console.log('Fetching employees from database...');
        
        const { data, error } = await supabase
          .from('employees')
          .select(`
            *,
            profiles (
              full_name,
              email,
              role
            )
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching employees:', error);
          throw error;
        }

        console.log('Fetched employees:', data);
        return data || [];
      } catch (err) {
        console.error('Employees fetch error:', err);
        throw err;
      }
    },
  });

  const addEmployee = useMutation({
    mutationFn: async (employeeData: CreateEmployeeData) => {
      try {
        console.log('Adding employee to database:', employeeData);
        
        const { data, error } = await supabase
          .from('employees')
          .insert(employeeData)
          .select()
          .single();

        if (error) {
          console.error('Error adding employee:', error);
          throw error;
        }

        console.log('Employee added successfully:', data);
        return data;
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

  return {
    employees,
    isLoading,
    error,
    addEmployee: addEmployee.mutate,
    isAdding: addEmployee.isPending,
  };
};
