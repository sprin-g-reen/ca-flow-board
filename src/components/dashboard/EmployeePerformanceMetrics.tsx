
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TrendingUp, Award, Target, Users } from 'lucide-react';

export const EmployeePerformanceMetrics = () => {
  const { employeePerformance } = useAnalytics();

  const getEmployeeInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPerformanceColor = (efficiency: number) => {
    if (efficiency >= 90) return 'bg-green-100 text-green-800';
    if (efficiency >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getWorkloadColor = (workload: number) => {
    if (workload <= 3) return 'bg-green-100 text-green-800';
    if (workload <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Data for charts
  const chartData = employeePerformance.map(emp => ({
    name: emp.employeeName ? emp.employeeName.split(' ')[0] : 'Unknown',
    tasks: emp.totalTasks,
    completed: emp.completedTasks,
    efficiency: emp.efficiency,
    workload: emp.workload,
  }));

  const topPerformers = employeePerformance
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Employees</p>
                <p className="text-2xl font-bold">{employeePerformance.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Avg Efficiency</p>
                <p className="text-2xl font-bold">
                  {(employeePerformance.reduce((sum, emp) => sum + emp.efficiency, 0) / employeePerformance.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Total Tasks</p>
                <p className="text-2xl font-bold">
                  {employeePerformance.reduce((sum, emp) => sum + emp.totalTasks, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">High Performers</p>
                <p className="text-2xl font-bold">
                  {employeePerformance.filter(emp => emp.efficiency >= 90).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion by Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="tasks" fill="#3b82f6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Efficiency Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                  <Line type="monotone" dataKey="efficiency" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((employee, index) => (
              <div key={employee.employeeId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-ca-blue text-white rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <Avatar>
                    <AvatarFallback>
                      {getEmployeeInitials(employee.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{employee.employeeName}</h4>
                    <p className="text-sm text-gray-600">
                      {employee.completedTasks}/{employee.totalTasks} tasks completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Badge className={`text-xs ${getPerformanceColor(employee.efficiency)}`}>
                    {employee.efficiency.toFixed(1)}% efficiency
                  </Badge>
                  <Badge className={`text-xs ${getWorkloadColor(employee.workload)}`}>
                    {employee.workload} active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Employee Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeePerformance.map(employee => (
              <div key={employee.employeeId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getEmployeeInitials(employee.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{employee.employeeName}</h4>
                      <p className="text-sm text-gray-600">Employee Performance</p>
                    </div>
                  </div>
                  <Badge className={`${getPerformanceColor(employee.efficiency)}`}>
                    {employee.efficiency.toFixed(1)}% Efficiency
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-lg font-bold">{employee.totalTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-lg font-bold text-green-600">{employee.completedTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">On Time</p>
                    <p className="text-lg font-bold text-blue-600">{employee.onTimeTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Workload</p>
                    <p className="text-lg font-bold text-orange-600">{employee.workload}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Efficiency Rate</span>
                    <span>{employee.efficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={employee.efficiency} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
