
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  MessageSquare,
  Upload,
  Timer,
  Target,
  Calendar,
  Bell,
  Activity,
  ArrowUp,
  BarChart3,
  Users,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user, name } = useSelector((state: RootState) => state.auth);
  const { tasks, isLoading } = useTasks();
  const { clients: allClients, isLoading: clientsLoading } = useClients();
  
  // Time tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [trackingTime, setTrackingTime] = useState(0);
  const [trackingTask, setTrackingTask] = useState<any>(null);
  
  const displayName = name || user?.fullName || user?.email || 'Employee';

  // Filter tasks assigned to current employee
  const myTasks = Array.isArray(tasks)
    ? tasks.filter((task) => {
        const assigned = task.assignedTo;
        if (!assigned) return false;

        // assigned can be an array of strings (ids) or array of user objects
        if (Array.isArray(assigned)) {
          return assigned.some((a: any) => {
            if (typeof a === 'string') {
              return a === user?.id || a === user?.email;
            }
            if (a && typeof a === 'object') {
              return a._id === user?.id || a.email === user?.email || a._id === user?.email;
            }
            return false;
          });
        }

        return false;
      })
    : [];
  
  // Calculate real metrics
  const totalTasks = myTasks.length;
  const activeTasks = myTasks.filter(t => 
    t.status !== 'completed'
  ).length;
  const completedTasks = myTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = myTasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;
  
  // Calculate completion rate and efficiency
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const efficiency = completionRate;
  
  // Get recent tasks (last 5)
  const recentTasks = [...myTasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getClientName = (task: any) => {
    // Prefer clientName on task (from useTasks mapping), fall back to lookup in clients
    if (task.clientName) return task.clientName;
    const cid = task.clientId || task.client?._id || task.client;
    if (!cid || !allClients) return cid || 'Unknown';
    const found = allClients.find((c: any) => c.id === cid || c._id === cid || c.id === String(cid));
    return found?.name || cid || 'Unknown';
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setTrackingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!isTracking) {
      setIsTracking(true);
      toast.success('Time tracking started');
    }
  };

  const handlePauseTimer = () => {
    setIsTracking(false);
    toast.info('Time tracking paused');
  };

  const handleStopTimer = () => {
    setIsTracking(false);
    toast.success(`Time logged: ${formatTime(trackingTime)}`);
    // TODO: Save to backend
    setTrackingTime(0);
    setTrackingTask(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'inprogress': return 'secondary';
      case 'review': return 'outline';
      default: return 'destructive';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {displayName}!
          </h2>
          <p className="text-muted-foreground">
            Here's your task overview and performance metrics for today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/employee/tasks')}>
            <Calendar className="mr-2 h-4 w-4" />
            My Tasks
          </Button>
          {!isTracking ? (
            <Button 
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleStartTimer}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Timer
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Timer className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="font-mono text-sm font-medium text-blue-700 dark:text-blue-300">
                  {formatTime(trackingTime)}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseTimer}
              >
                <Pause className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStopTimer}
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{activeTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total completed
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{efficiency.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTasks} total tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Task Progress Overview
            </CardTitle>
            <CardDescription>
              Your daily performance and completion metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Completion Rate</span>
                <span className="font-medium">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={completionRate} 
                className="h-3" 
              />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{activeTasks}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-lg font-semibold text-orange-600">{overdueTasks}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Notifications & Alerts
            </CardTitle>
            <CardDescription>
              Important updates and reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {overdueTasks} {overdueTasks === 1 ? 'task is' : 'tasks are'} overdue
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Prioritize these immediately
                  </p>
                </div>
              </div>
            )}
            
            {activeTasks > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {activeTasks} active {activeTasks === 1 ? 'task' : 'tasks'} in progress
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Keep up the good work!
                  </p>
                </div>
              </div>
            )}

            {completionRate >= 80 && totalTasks > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Great performance!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {completionRate.toFixed(0)}% completion rate
                  </p>
                </div>
              </div>
            )}

            {totalTasks === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications at this time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks and Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Recent Tasks
            </CardTitle>
            <CardDescription>
              Your latest assignments and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks assigned yet</p>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/employee/tasks')}
                  >
                    <div className={`h-2 w-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'inprogress' ? 'bg-blue-500' :
                      task.status === 'review' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.clientId ? `Client ID: ${task.clientId}` : 'No client'} • 
                        Due: {task.dueDate ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) : 'No deadline'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(task.status)} className="text-xs">
                        {task.status}
                      </Badge>
                      <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Frequently used features and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col space-y-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950"
                onClick={() => navigate('/employee/tasks')}
              >
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="text-center">
                  <div className="font-medium text-sm">View Tasks</div>
                  <div className="text-xs text-muted-foreground">{totalTasks} tasks</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col space-y-2 hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950"
                onClick={isTracking ? handlePauseTimer : handleStartTimer}
              >
                <Timer className="h-5 w-5 text-green-600" />
                <div className="text-center">
                  <div className="font-medium text-sm">Time Tracking</div>
                  <div className="text-xs text-muted-foreground">
                    {isTracking ? formatTime(trackingTime) : 'Start timer'}
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col space-y-2 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950"
                onClick={() => navigate('/employee/chat')}
              >
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <div className="text-center">
                  <div className="font-medium text-sm">Messages</div>
                  <div className="text-xs text-muted-foreground">Chat with team</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col space-y-2 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950"
                onClick={() => navigate('/employee/clients')}
              >
                <Users className="h-5 w-5 text-orange-600" />
                <div className="text-center">
                  <div className="font-medium text-sm">My Clients</div>
                  <div className="text-xs text-muted-foreground">View assigned</div>
                </div>
              </Button>
            </div>
            
            <div className="pt-2">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Users className="mr-2 h-4 w-4" />
                Request Help from Team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
