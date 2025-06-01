
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';

export const WorkloadDashboard = () => {
  const { employees } = useEmployees();
  const { tasks } = useTasks();

  // Calculate workload data for each employee
  const workloadData = employees.map(employee => {
    const employeeTasks = tasks.filter(task => 
      task.assignedTo.includes(employee.id)
    );
    
    const todoTasks = employeeTasks.filter(task => task.status === 'todo').length;
    const inProgressTasks = employeeTasks.filter(task => task.status === 'inprogress').length;
    const reviewTasks = employeeTasks.filter(task => task.status === 'review').length;
    const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
    const overdueTasks = employeeTasks.filter(task => 
      new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length;

    const totalActiveTasks = todoTasks + inProgressTasks + reviewTasks;
    const capacity = 8; // Assume 8 tasks is full capacity
    const utilization = Math.min((totalActiveTasks / capacity) * 100, 100);

    return {
      id: employee.id,
      name: employee.profiles?.full_name || employee.employee_id,
      department: employee.department || 'General',
      position: employee.position || 'Employee',
      todoTasks,
      inProgressTasks,
      reviewTasks,
      completedTasks,
      overdueTasks,
      totalActiveTasks,
      utilization,
    };
  });

  const getEmployeeInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization <= 50) return 'text-green-600';
    if (utilization <= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationBadgeColor = (utilization: number) => {
    if (utilization <= 50) return 'bg-green-100 text-green-800';
    if (utilization <= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Data for the chart
  const chartData = workloadData.map(emp => ({
    name: emp.name.split(' ')[0], // First name only for chart
    'Active Tasks': emp.totalActiveTasks,
    'Completed': emp.completedTasks,
    'Overdue': emp.overdueTasks,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Active Tasks</p>
                <p className="text-2xl font-bold">
                  {workloadData.reduce((sum, emp) => sum + emp.totalActiveTasks, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Completed Today</p>
                <p className="text-2xl font-bold">
                  {workloadData.reduce((sum, emp) => sum + emp.completedTasks, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Overdue Tasks</p>
                <p className="text-2xl font-bold">
                  {workloadData.reduce((sum, emp) => sum + emp.overdueTasks, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Task Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Active Tasks" fill="#3b82f6" />
                <Bar dataKey="Completed" fill="#10b981" />
                <Bar dataKey="Overdue" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Employee Workload Table */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Employee Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workloadData.map(employee => (
              <div key={employee.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getEmployeeInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm text-gray-600">{employee.position} • {employee.department}</p>
                    </div>
                  </div>
                  <Badge className={getUtilizationBadgeColor(employee.utilization)}>
                    {employee.utilization.toFixed(0)}% Utilized
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Capacity Utilization</span>
                    <span className={getUtilizationColor(employee.utilization)}>
                      {employee.totalActiveTasks}/8 tasks
                    </span>
                  </div>
                  <Progress value={employee.utilization} className="h-2" />
                </div>

                <div className="grid grid-cols-5 gap-2 mt-3 text-center">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">To Do</p>
                    <p className="font-medium">{employee.todoTasks}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-xs text-blue-600">In Progress</p>
                    <p className="font-medium text-blue-600">{employee.inProgressTasks}</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded">
                    <p className="text-xs text-yellow-600">Review</p>
                    <p className="font-medium text-yellow-600">{employee.reviewTasks}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-xs text-green-600">Completed</p>
                    <p className="font-medium text-green-600">{employee.completedTasks}</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <p className="text-xs text-red-600">Overdue</p>
                    <p className="font-medium text-red-600">{employee.overdueTasks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
