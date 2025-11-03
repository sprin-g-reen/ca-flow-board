
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Clock, CheckCircle, AlertTriangle, BarChart } from 'lucide-react';

export const RealTimeTaskMonitor = () => {
  const { taskMetrics, realTimeData, isLoadingRealTime } = useAnalytics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'inprogress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (isLoadingRealTime) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Real-Time Task Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ca-blue"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Tasks</p>
                <p className="text-2xl font-bold">{taskMetrics.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{taskMetrics.completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{taskMetrics.pendingTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold">{taskMetrics.overdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Progress</span>
              <span>{taskMetrics.completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={taskMetrics.completionRate} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{taskMetrics.completedTasks} completed</span>
              <span>{taskMetrics.totalTasks} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Task Activity</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
              <span className="text-xs text-gray-500">
                Updates every 30s
              </span>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Last updated: {realTimeData?.lastUpdated ? new Date(realTimeData.lastUpdated).toLocaleTimeString() : 'Just now'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {realTimeData?.recentTasks?.slice(0, 8).map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all hover:bg-gray-100">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{task.title}</h4>
                  <p className="text-xs text-gray-600">{task.client_name || 'No client assigned'}</p>
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(task.updatedAt || task.createdAt || task.updated_at || task.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                    {task.status}
                  </Badge>
                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
            {(!realTimeData?.recentTasks || realTimeData.recentTasks.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent task activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
