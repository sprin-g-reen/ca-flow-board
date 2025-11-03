
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { CheckCircle, Clock, FileText, MessageSquare, Upload, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

const ClientDashboard = () => {
  const { profile } = useAuth();
  const { tasks, isLoading } = useTasks();
  const { clients } = useClients();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  
  // Find the client record for the current user
  const currentClient = clients.find(client => client.email === profile?.email);
  
  // Filter tasks for current client
  const clientTasks = tasks.filter(task => task.clientId === currentClient?.id);
  const activeTasks = clientTasks.filter(task => task.status !== 'completed');
  const completedTasks = clientTasks.filter(task => task.status === 'completed');
  const recentTasks = clientTasks.slice(0, 5);
  
  // Calculate real document and message counts (mock for now - will be replaced with real API)
  const documentCount = clientTasks.reduce((count, task) => count + (task.subtasks?.length || 0), 0);
  const messageCount = clientTasks.filter(task => task.status === 'inprogress').length; // Approximate active conversations
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'inprogress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (task: any) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'review') return 80;
    if (task.status === 'inprogress') return 50;
    return 20;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-ca-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ca-green-dark">Welcome back, {currentClient?.name || profile?.fullName}!</h1>
          <p className="text-muted-foreground">Track your service requests and project progress</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/client/documents')} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            My Documents
          </Button>
          <Button onClick={() => navigate('/client/tasks')} className="bg-ca-blue hover:bg-ca-blue-dark">
            <Eye className="h-4 w-4 mr-2" />
            View All Tasks
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold text-blue-600">{activeTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-purple-600">{documentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-orange-600">{messageCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-ca-green-dark">Recent Tasks Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length > 0 ? recentTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{calculateProgress(task)}%</span>
                      </div>
                      <Progress value={calculateProgress(task)} className="h-2" />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
                  <p className="text-gray-600">You don't have any tasks assigned yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-ca-green-dark">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/client/documents')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            <Button 
              onClick={() => navigate('/client/tasks')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Tasks
            </Button>
            <Button 
              onClick={() => navigate('/client/documents')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Reports
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Service Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ca-green-dark">Your Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">GST Filing</h3>
              <p className="text-sm text-gray-600 mb-3">Monthly GST return filing and compliance</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Next Due: 10th</span>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">ITR Filing</h3>
              <p className="text-sm text-gray-600 mb-3">Annual income tax return preparation</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Due: July 31</span>
                <Badge variant="outline">Pending</Badge>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">ROC Filing</h3>
              <p className="text-sm text-gray-600 mb-3">Company registration compliance</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Annual</span>
                <Badge variant="outline">Up to date</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <TaskDetailModal 
        task={selectedTask}
        open={showTaskDetail}
        onOpenChange={setShowTaskDetail}
      />
    </div>
  );
};

export default ClientDashboard;
