
import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { AddWidgetButton } from '@/components/dashboard/AddWidgetButton';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  FileText,
  PlusSquare,
  Users
} from 'lucide-react';

const OwnerDashboard = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { invoices } = useSelector((state: RootState) => state.invoices);
  
  // Calculate total revenue
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingRevenue = totalRevenue - paidRevenue;

  // Task statistics
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'inprogress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const reviewTasks = tasks.filter(task => task.status === 'review').length;
  
  // Task status data for chart
  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
    { name: 'To Do', value: todoTasks, color: '#6b7280' },
    { name: 'Review', value: reviewTasks, color: '#f59e0b' },
  ];

  // Revenue by month data
  const revenueByMonthData = [
    { name: 'Jan', revenue: 15000 },
    { name: 'Feb', revenue: 20000 },
    { name: 'Mar', revenue: 18000 },
    { name: 'Apr', revenue: 25000 },
    { name: 'May', revenue: 30000 },
    { name: 'Jun', revenue: 28000 },
  ];

  // Sample client data (in a real app, this would come from API/Redux)
  const clients = [
    { id: 101, name: 'ABC Corp', revenue: 100000, tasks: 5 },
    { id: 102, name: 'XYZ Industries', revenue: 75000, tasks: 3 },
    { id: 103, name: 'Smith & Co.', revenue: 50000, tasks: 4 },
    { id: 104, name: 'Johnson LLC', revenue: 30000, tasks: 2 },
    { id: 105, name: 'Patel Enterprises', revenue: 40000, tasks: 3 },
  ];

  // Sample employee data 
  const employees = [
    { id: 301, name: 'Jane Smith', tasksCompleted: 25, efficiency: 92 },
    { id: 302, name: 'Mike Brown', tasksCompleted: 18, efficiency: 85 },
    { id: 303, name: 'Sara Williams', tasksCompleted: 30, efficiency: 95 },
    { id: 304, name: 'Alex Johnson', tasksCompleted: 12, efficiency: 78 },
  ];

  const [widgets, setWidgets] = useState([
    { id: 'stats', type: 'stats' },
    { id: 'overview', type: 'overview' },
    { id: 'clients', type: 'clients' },
    { id: 'employees', type: 'employees' }
  ]);

  const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
    setWidgets((prevWidgets) => {
      const newWidgets = [...prevWidgets];
      const dragWidget = newWidgets[dragIndex];
      newWidgets.splice(dragIndex, 1);
      newWidgets.splice(hoverIndex, 0, dragWidget);
      return newWidgets;
    });
  }, []);

  const handleAddWidget = (widgetType: string) => {
    setWidgets((prev) => [...prev, { id: `${widgetType}-${Date.now()}`, type: widgetType }]);
  };

  const renderWidget = (widget: { id: string; type: string }, index: number) => {
    switch (widget.type) {
      case 'stats':
        return (
          <DashboardWidget key={widget.id} id={widget.id} index={index} moveWidget={moveWidget}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                  <div className="mt-2 flex items-center text-xs">
                    <ArrowUp className="mr-1 h-4 w-4 text-ca-green" />
                    <span className="text-ca-green">Increasing</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Revenue
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{pendingRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {invoices.filter(inv => inv.status === 'sent').length} pending invoices
                  </p>
                  <div className="mt-2 flex items-center text-xs">
                    <ArrowDown className="mr-1 h-4 w-4 text-ca-red" />
                    <span className="text-ca-red">Needs attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +2 new this month
                  </p>
                  <div className="mt-2 flex items-center text-xs">
                    <ArrowUp className="mr-1 h-4 w-4 text-ca-green" />
                    <span className="text-ca-green">Growing</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Task Completion
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedTasks}/{tasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((completedTasks / tasks.length) * 100)}% completion rate
                  </p>
                  <div className="mt-2 flex items-center text-xs">
                    <ArrowUp className="mr-1 h-4 w-4 text-ca-green" />
                    <span className="text-ca-green">On track</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DashboardWidget>
        );
      case 'overview':
        return (
          <DashboardWidget key={widget.id} id={widget.id} index={index} moveWidget={moveWidget}>
            <Tabs defaultValue="overview" className="p-4">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="clients">Top Clients</TabsTrigger>
                <TabsTrigger value="employees">Employee Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Task Status</CardTitle>
                      <CardDescription>Distribution of tasks by status</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={taskStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {taskStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Revenue Trend</CardTitle>
                      <CardDescription>Monthly revenue for current year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={revenueByMonthData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} 
                          />
                          <Bar dataKey="revenue" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Activities</CardTitle>
                      <CardDescription>Latest actions across your firm</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">View All</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-2 h-10 bg-ca-blue-light rounded-full mr-3" />
                        <div className="flex-1">
                          <p className="font-medium">New client onboarded</p>
                          <p className="text-sm text-muted-foreground">Johnson LLC was added as a client</p>
                        </div>
                        <span className="text-sm text-muted-foreground">2 hours ago</span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-2 h-10 bg-ca-green rounded-full mr-3" />
                        <div className="flex-1">
                          <p className="font-medium">Invoice paid</p>
                          <p className="text-sm text-muted-foreground">XYZ Industries paid invoice #INV-2024-002</p>
                        </div>
                        <span className="text-sm text-muted-foreground">5 hours ago</span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-2 h-10 bg-ca-yellow rounded-full mr-3" />
                        <div className="flex-1">
                          <p className="font-medium">Task template created</p>
                          <p className="text-sm text-muted-foreground">New audit template added by Sarah Admin</p>
                        </div>
                        <span className="text-sm text-muted-foreground">Yesterday</span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-2 h-10 bg-ca-red rounded-full mr-3" />
                        <div className="flex-1">
                          <p className="font-medium">Overdue task reminder</p>
                          <p className="text-sm text-muted-foreground">Monthly GST Filing for ABC Corp is overdue</p>
                        </div>
                        <span className="text-sm text-muted-foreground">Yesterday</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="clients" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Top Clients</CardTitle>
                      <CardDescription>By revenue contribution</CardDescription>
                    </div>
                    <Button>
                      <PlusSquare className="mr-2 h-4 w-4" />
                      Add Client
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-4 bg-muted p-3 text-sm font-medium">
                        <div>Client Name</div>
                        <div className="text-right">Revenue</div>
                        <div className="text-right">Active Tasks</div>
                        <div className="text-right">Actions</div>
                      </div>
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="grid grid-cols-4 items-center border-t p-3 text-sm"
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-right">₹{client.revenue.toLocaleString()}</div>
                          <div className="text-right">{client.tasks}</div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue by Client</CardTitle>
                      <CardDescription>Top 5 clients by revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={clients}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="revenue"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {clients.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={['#1e3a8a', '#3b82f6', '#10b981', '#eab308', '#64748b'][index % 5]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Growth</CardTitle>
                      <CardDescription>New clients added over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart 
                          data={[
                            { month: 'Jan', clients: 1 },
                            { month: 'Feb', clients: 2 },
                            { month: 'Mar', clients: 1 },
                            { month: 'Apr', clients: 2 },
                            { month: 'May', clients: 0 },
                            { month: 'Jun', clients: 1 },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="clients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="employees" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Employee Performance</CardTitle>
                      <CardDescription>Task completion and efficiency</CardDescription>
                    </div>
                    <Button>
                      <PlusSquare className="mr-2 h-4 w-4" />
                      Add Employee
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-4 bg-muted p-3 text-sm font-medium">
                        <div>Name</div>
                        <div className="text-right">Tasks Completed</div>
                        <div className="text-right">Efficiency Score</div>
                        <div className="text-right">Actions</div>
                      </div>
                      {employees.map((employee) => (
                        <div
                          key={employee.id}
                          className="grid grid-cols-4 items-center border-t p-3 text-sm"
                        >
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-right">{employee.tasksCompleted}</div>
                          <div className="text-right">
                            <span className={
                              employee.efficiency >= 90 ? "text-ca-green" : 
                              employee.efficiency >= 80 ? "text-ca-yellow-dark" : "text-ca-red"
                            }>
                              {employee.efficiency}%
                            </span>
                          </div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Tasks Completed by Employee</CardTitle>
                    <CardDescription>This month's performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={employees}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tasksCompleted" fill="#1e3a8a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DashboardWidget>
        );
      // Add more cases for other widget types
      default:
        return null;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Owner Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your firm's performance and key metrics.
            </p>
          </div>
          <AddWidgetButton onAddWidget={handleAddWidget} />
        </div>

        <div className="space-y-6">
          {widgets.map((widget, index) => renderWidget(widget, index))}
        </div>
      </div>
    </DndProvider>
  );
};

export default OwnerDashboard;
