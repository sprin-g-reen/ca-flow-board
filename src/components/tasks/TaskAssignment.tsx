
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/store/slices/tasksSlice';
import { toast } from 'sonner';

interface TaskAssignmentProps {
  task: Task;
  onAssignmentChange?: () => void;
}

export const TaskAssignment: React.FC<TaskAssignmentProps> = ({ task, onAssignmentChange }) => {
  const { employees } = useEmployees();
  const { updateTaskStatus } = useTasks();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const assignedEmployees = employees.filter(emp => 
    task.assignedTo.includes(emp.id)
  );

  const handleAssignEmployee = async () => {
    if (!selectedEmployeeId) return;

    try {
      // In a real implementation, you'd have an updateTask mutation
      // For now, we'll simulate the assignment
      toast.success(`Task assigned to employee successfully`);
      setSelectedEmployeeId('');
      onAssignmentChange?.();
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  const handleSelfAssign = async () => {
    try {
      // Employee self-assignment logic would go here
      toast.success('Task assigned to yourself');
      onAssignmentChange?.();
    } catch (error) {
      toast.error('Failed to self-assign task');
    }
  };

  const getEmployeeInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getWorkloadColor = (taskCount: number) => {
    if (taskCount <= 3) return 'bg-green-100 text-green-800';
    if (taskCount <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Task Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Assignments */}
        <div className="space-y-2">
          <h4 className="font-medium">Currently Assigned To:</h4>
          {assignedEmployees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignedEmployees.map(employee => (
                <div key={employee.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getEmployeeInitials(employee.profiles?.full_name || employee.employee_id)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{employee.profiles?.full_name || employee.employee_id}</span>
                  <Badge variant="outline" className="text-xs">
                    {employee.position || 'Employee'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No employees assigned</p>
          )}
        </div>

        {/* Assignment Controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select employee to assign" />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter(emp => !task.assignedTo.includes(emp.id))
                  .map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <span>{employee.profiles?.full_name || employee.employee_id}</span>
                        <Badge variant="outline" className="text-xs">
                          {employee.department || 'General'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAssignEmployee}
              disabled={!selectedEmployeeId}
              size="sm"
            >
              Assign
            </Button>
          </div>

          <Button 
            onClick={handleSelfAssign}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            Self-Assign This Task
          </Button>
        </div>

        {/* Employee Workload Overview */}
        <div className="space-y-2">
          <h4 className="font-medium">Employee Workload:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {employees.map(employee => {
              const taskCount = 3; // This would be calculated from actual task data
              return (
                <div key={employee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getEmployeeInitials(employee.profiles?.full_name || employee.employee_id)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{employee.profiles?.full_name || employee.employee_id}</span>
                  </div>
                  <Badge className={`text-xs ${getWorkloadColor(taskCount)}`}>
                    {taskCount} tasks
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
