
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormDialog } from "@/components/shared/FormDialog";
import { AddClientForm } from "@/components/forms/AddClientForm";
import { 
  Plus, 
  BarChart3, 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Target,
  Activity,
  UserCheck,
  Briefcase,
  ArrowUp,
  ArrowDown,
  Eye,
  MoreHorizontal,
  Bell,
  Zap,
  Star
} from "lucide-react";
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { useTasks } from '@/hooks/useTasks';

const OwnerDashboard = () => {
  const { clients } = useClients();
  const { quotations } = usePayments();
  const { tasks: realTimeTasks } = useTasks();
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  
  // Add safe array handling to prevent crashes
  const safeTasks = Array.isArray(realTimeTasks) ? realTimeTasks : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeQuotations = Array.isArray(quotations) ? quotations : [];
  
  // Calculate real-time metrics with safe arrays
  const totalTasks = safeTasks.length;
  const activeTasks = safeTasks.filter(t => t.status !== 'completed').length;
  const completedTasks = safeTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = safeTasks.filter(t => 
    new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;
  
  const totalRevenue = safeQuotations.reduce((sum, q) => sum + q.total_amount, 0);
  const pendingPayments = safeQuotations.filter(q => q.status === 'sent' || q.status === 'draft').reduce((sum, q) => sum + q.total_amount, 0);
  const activeQuotations = safeQuotations.filter(q => q.status === 'sent' || q.status === 'draft').length;
  
  // Get recent tasks
  const recentTasks = safeTasks.slice(0, 5);
  
  // Get top clients by project count
  const topClients = safeClients.slice(0, 4).map(client => ({
    id: client.id,
    name: client.name,
    industry: client.industry || 'General',
    contact: client.contact_person || 'N/A',
    activeProjects: safeTasks.filter(t => t.clientId === client.id && t.status !== 'completed').length,
    totalValue: safeQuotations.filter(q => q.client_id === client.id).reduce((sum, q) => sum + q.total_amount, 0),
  }));

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowAddClientDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalTasks}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {activeTasks} active
              </Badge>
              <span>•</span>
              <span>{completedTasks} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12.5%</span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{safeClients.length}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {activeQuotations} quotes pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              ₹{pendingPayments.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 text-orange-600" />
              <span>{activeQuotations} invoices pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Task Completion Progress
            </CardTitle>
            <CardDescription>
              Overall progress across all active projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>
            
            {overdueTasks > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Overdue Tasks</span>
                  <span className="font-medium text-red-600">{overdueTasks}</span>
                </div>
                <Progress value={overdueRate} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{activeTasks}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{overdueTasks}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Quick Alerts
            </CardTitle>
            <CardDescription>
              Important notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {overdueTasks} tasks are overdue
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Review and update deadlines
                  </p>
                </div>
              </div>
            )}
            
            {activeQuotations > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <FileText className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {activeQuotations} quotations pending
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Follow up with clients
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  System running smoothly
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  All services operational
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Top Clients */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Recent Tasks
            </CardTitle>
            <CardDescription>
              Latest task updates and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length > 0 ? recentTasks.map((task, index) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-900/50">
                  <div className={`h-2 w-2 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'inprogress' ? 'bg-blue-500' :
                    task.status === 'review' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.clientName || 'No client'} • Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={
                    task.status === 'completed' ? 'default' :
                    task.status === 'inprogress' ? 'secondary' :
                    task.status === 'review' ? 'outline' : 'destructive'
                  } className="text-xs">
                    {task.status}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks yet</p>
                  <p className="text-xs">Create your first task to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Top Clients
            </CardTitle>
            <CardDescription>
              Your most active clients this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClients.length > 0 ? topClients.map((client, index) => (
                <div key={client.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-900/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                    <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.industry} • {client.activeProjects} active projects
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{client.totalValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total value</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No clients yet</p>
                  <p className="text-xs">Add your first client to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Client Dialog */}
      <FormDialog
        isOpen={showAddClientDialog}
        onClose={() => setShowAddClientDialog(false)}
        title="Add New Client"
        description="Create a new client profile to start managing their projects and documents."
      >
        <AddClientForm onClose={() => setShowAddClientDialog(false)} />
      </FormDialog>
    </div>
  );
};

export default OwnerDashboard;
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Tasks:</span>
                <span className="font-bold">{totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Tasks:</span>
                <span className="font-bold text-blue-600">{activeTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Tasks:</span>
                <span className="font-bold text-green-600">{completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>Overdue Tasks:</span>
                <span className="font-bold text-red-600">{overdueTasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "real-time-monitor",
      content: (
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-ca-green/10 to-transparent">
            <CardTitle>Real-Time Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <RealTimeTaskMonitor />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "performance-metrics",
      content: (
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-ca-green/10 to-transparent">
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Average Completion Time:</span>
                <span className="font-bold">{completedTasks > 0 ? '3.2 days' : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasks Completed This Week:</span>
                <span className="font-bold text-green-600">{completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>On-time Delivery Rate:</span>
                <span className="font-bold text-blue-600">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Employee Efficiency:</span>
                <span className="font-bold text-purple-600">{totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "revenue-summary",
      content: (
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-ca-yellow/10 to-transparent">
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Monthly Revenue:</span>
                <span className="font-bold text-green-600">₹{totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Payments:</span>
                <span className="font-bold text-orange-600">₹{pendingPayments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Growth Rate:</span>
                <span className="font-bold text-blue-600">+{safeQuotations.length > 0 ? 12 : 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Active Quotations:</span>
                <span className="font-bold">{activeQuotations}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  const initialPinnedClients = topClients;
  
  // State to manage widgets
  const [widgets, setWidgets] = useState(initialWidgets);
  const [pinnedClients, setPinnedClients] = useState(initialPinnedClients);
  
  // Function to move widgets
  const moveWidget = (dragIndex: number, hoverIndex: number) => {
    const newWidgets = [...widgets];
    const draggedWidget = newWidgets.splice(dragIndex, 1)[0];
    newWidgets.splice(hoverIndex, 0, draggedWidget);
    setWidgets(newWidgets);
  };
  
  // Function to remove a widget
  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter(widget => widget.id !== widgetId));
  };
  
  // Function to add a new widget
  const handleAddWidget = (widgetType: string) => {
    // Create different widget content based on type
    let newWidget;
    
    switch (widgetType) {
      case 'revenue':
        newWidget = {
          id: `revenue-${Date.now()}`,
          content: (
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total Revenue: ₹125,000</div>
                  <div>Monthly Growth: +12%</div>
                  <div>Projected Q4: ₹180,000</div>
                </div>
              </CardContent>
            </Card>
          )
        };
        break;
      
      case 'tasks':
        newWidget = {
          id: `tasks-${Date.now()}`,
          content: (
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-ca-green/10 to-transparent">
                <CardTitle>Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>High Priority: {realTimeTasks.filter(t => t.priority === 'high').length}</div>
                  <div>Medium Priority: {realTimeTasks.filter(t => t.priority === 'medium').length}</div>
                  <div>Low Priority: {realTimeTasks.filter(t => t.priority === 'low').length}</div>
                </div>
              </CardContent>
            </Card>
          )
        };
        break;
      
      case 'clients':
        newWidget = {
          id: `clients-${Date.now()}`,
          content: (
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-ca-yellow/10 to-transparent">
                <CardTitle>Client Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total Clients: {safeClients.length}</div>
                  <div>Active Projects: {activeTasks}</div>
                  <div>Client Satisfaction: 4.8/5</div>
                </div>
              </CardContent>
            </Card>
          )
        };
        break;
        
      case 'employees':
        newWidget = {
          id: `employees-${Date.now()}`,
          content: (
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
                <CardTitle>Employee Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total Employees: 42</div>
                  <div>Active: 38</div>
                  <div>On Leave: 4</div>
                  <div>Avg. Workload: 87%</div>
                </div>
              </CardContent>
            </Card>
          )
        };
        break;
        
      default:
        return;
    }
    
    setWidgets([...widgets, newWidget]);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-ca-blue/10 to-transparent pb-6">
          <div>
            <CardTitle className="text-2xl text-ca-blue-dark flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Owner Dashboard
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Real-time overview of business metrics and analytics
            </CardDescription>
          </div>
          <AddWidgetButton onAddWidget={handleAddWidget} />
        </CardHeader>
        <CardContent className="py-6">
          <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
              {widgets.map((widget, index) => (
                <DashboardWidget
                  key={widget.id}
                  id={widget.id}
                  index={index}
                  moveWidget={moveWidget}
                  onRemove={handleRemoveWidget}
                >
                  {widget.content}
                </DashboardWidget>
              ))}
            </div>
          </DndProvider>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-ca-yellow/10 to-transparent pb-6">
          <div>
            <CardTitle className="text-2xl text-ca-yellow-dark flex items-center gap-2">
              <Users className="h-6 w-6" />
              Key Clients
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Quick access to your most important client relationships
            </CardDescription>
          </div>
          <Button 
            className="bg-ca-yellow hover:bg-ca-yellow-dark"
            onClick={() => setShowAddClientDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </CardHeader>
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {pinnedClients.map((client) => (
              <Card key={client.id} className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <p className="text-sm text-gray-600">{client.industry}</p>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Contact:</span>
                      <span className="font-medium">{client.contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Projects:</span>
                      <span className="font-bold text-blue-600">{client.activeProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Value:</span>
                      <span className="font-bold text-green-600">₹{client.totalValue.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <FormDialog
        open={showAddClientDialog}
        onOpenChange={setShowAddClientDialog}
        title="Add New Client"
        description="Create a new client profile to manage projects and billing."
        showFooter={false}
        className="max-w-4xl"
      >
        <AddClientForm onSuccess={() => setShowAddClientDialog(false)} />
      </FormDialog>
    </div>
  );
};

export default OwnerDashboard;
