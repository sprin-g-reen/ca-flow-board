
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import TaskBoard from '@/components/tasks/TaskBoard';
import { useTasks } from '@/hooks/useTasks';

const EmployeeTasks = () => {
  const { tasks, isLoading } = useTasks();
  const [showFilters, setShowFilters] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6 pt-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  // Safe task handling
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const totalTasks = safeTasks.length;
  const activeTasks = safeTasks.filter(t => t.status !== 'completed').length;
  const completedTasks = safeTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = safeTasks.filter(t => 
    new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            My Tasks
          </h2>
          <p className="text-muted-foreground">
            Manage your assigned tasks and track your progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button 
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule View
          </Button>
        </div>
      </div>

      {/* Task Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">All assigned tasks</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{activeTasks}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      {totalTasks > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Task Completion Progress
            </CardTitle>
            <CardDescription>
              Your overall progress across all assigned tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={completionRate} 
                className="h-3" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedTasks} completed</span>
                <span>{totalTasks} total tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Board */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardTitle className="text-2xl text-purple-900 dark:text-purple-100">
            Task Board
          </CardTitle>
          <CardDescription className="text-purple-700 dark:text-purple-300">
            Organize and manage your tasks with drag-and-drop functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <TaskBoard tasks={safeTasks} basePath="/employee" />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeTasks;
