
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  Calendar,
  FileText,
  MessageSquare,
  Paperclip,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Task, updateSubtaskStatus } from '@/store/slices/tasksSlice';
import { cn } from '@/lib/utils';

interface TaskDetailViewProps {
  task: Task;
  userRole?: 'owner' | 'admin' | 'employee' | 'client';
}

export function TaskDetailView({ task, userRole = 'employee' }: TaskDetailViewProps) {
  const dispatch = useDispatch();
  const [newComment, setNewComment] = useState('');

  const handleSubtaskToggle = (subtaskId: string, isCompleted: boolean) => {
    dispatch(updateSubtaskStatus({ 
      taskId: task.id, 
      subtaskId, 
      isCompleted 
    }));
  };

  const calculateProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.isCompleted).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'inprogress': return 'text-blue-600 bg-blue-50';
      case 'review': return 'text-purple-600 bg-purple-50';
      case 'todo': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const progress = calculateProgress();
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority.toUpperCase()}
              </Badge>
              <Badge className={getStatusColor(task.status)}>
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                {task.category.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Client: {task.clientName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={cn("text-sm", isOverdue && "text-red-600 font-medium")}>
                Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Created: {format(new Date(task.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Payment Information (Only for Owner/Admin) */}
          {task.isPayableTask && (userRole === 'owner' || userRole === 'admin') && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{task.price?.toLocaleString()} | 
                      Status: {task.paymentStatus} |
                      Quotation: {task.quotationSent ? 'Sent' : 'Pending'}
                    </p>
                  </div>
                  {!task.quotationSent && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Generate Quote
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Subtasks ({task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.subtasks
              .sort((a, b) => a.order - b.order)
              .map((subtask) => (
                <Card key={subtask.id} className={cn(
                  "p-4 transition-all",
                  subtask.isCompleted ? "bg-green-50 border-green-200" : "hover:shadow-sm"
                )}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={subtask.isCompleted}
                      onCheckedChange={(checked) => 
                        handleSubtaskToggle(subtask.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-medium",
                        subtask.isCompleted && "line-through text-muted-foreground"
                      )}>
                        {subtask.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {subtask.description}
                      </p>
                      {subtask.dueDate && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Due: {subtask.dueDate}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Step {subtask.order}
                    </Badge>
                  </div>
                </Card>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments & Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.comments && task.comments.length > 0 ? (
            <div className="space-y-3">
              {task.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {comment.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No comments yet. Be the first to add an update!
            </p>
          )}

          {/* Add Comment */}
          <div className="space-y-3 pt-4 border-t">
            <Textarea
              placeholder="Add a comment or update..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20"
            />
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach File
              </Button>
              <Button 
                size="sm" 
                className="bg-ca-blue hover:bg-ca-blue-dark"
                disabled={!newComment.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {task.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{attachment}</span>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
