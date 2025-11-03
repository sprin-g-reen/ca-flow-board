
import { useDrag } from 'react-dnd';
import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Edit, User, Building2, CheckCircle2, AlertCircle, Timer, MoreHorizontal, Trash2, Archive, UserPlus } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Task, TaskPriority, TaskStatus } from '@/store/slices/tasksSlice';
import { useEmployees } from '@/hooks/useEmployees';
import { useClients } from '@/hooks/useClients';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import TaskDetailModal from './TaskDetailModal';

interface TaskCardProps {
  task: Task;
  basePath: string;
}

interface DragItem {
  type: string;
  taskId: string;
  status: TaskStatus;
  originalStatus: TaskStatus;
}

const getPriorityStyles = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return 'bg-ca-red text-white';
    case 'high':
      return 'bg-ca-yellow-dark text-white';
    case 'medium':
      return 'bg-ca-yellow-light text-ca-gray-dark';
    case 'low':
      return 'bg-ca-green-light text-ca-gray-dark';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getCategoryBadgeStyles = (category: string) => {
  switch (category) {
    case 'gst':
      return 'bg-blue-100 text-blue-800';
    case 'tax':
      return 'bg-purple-100 text-purple-800';
    case 'audit':
      return 'bg-green-100 text-green-800';
    case 'compliance':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const TaskCard = ({ task, basePath }: TaskCardProps) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { employees } = useEmployees();
  const { clients } = useClients();
  const { deleteTask, isDeleting, archiveTask, isArchiving } = useTasks();
  const { user } = useAuth();
  
  // Check if user is owner
  const isOwner = user?.role === 'owner';
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { 
      type: 'TASK',
      taskId: task.id, 
      status: task.status,
      originalStatus: task.status
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  // Get real client and employee data
  const client = clients?.find(c => c.id === task.clientId);
  
  // Handle assignedTo - it can be an array of strings (IDs) or objects with _id
  const assignedIds = task.assignedTo.map(item => 
    typeof item === 'string' ? item : (item as any)._id
  );
  
  const assignedEmployees = employees?.filter(emp => 
    assignedIds.includes(emp._id)
  ) || [];
  
  // Get collaborators - similar handling
  const collaboratorIds = (task.collaborators || []).map(item =>
    typeof item === 'string' ? item : (item as any)._id
  );
  
  const collaborators = employees?.filter(emp => 
    collaboratorIds.includes(emp._id)
  ) || [];
  
  // Combined team members (assigned + collaborators)
  const allTeamMembers = [...assignedEmployees, ...collaborators];
  
  // Get real-time status indicators
  const getStatusIndicator = () => {
    const now = new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    
    if (task.status === 'completed') {
      return { icon: CheckCircle2, color: 'text-green-600', text: 'Completed' };
    }
    
    if (dueDate && dueDate < now && task.status !== 'completed' as TaskStatus) {
      return { icon: AlertCircle, color: 'text-red-600', text: 'Overdue' };
    }
    
    if (dueDate && dueDate.toDateString() === now.toDateString()) {
      return { icon: Timer, color: 'text-orange-600', text: 'Due Today' };
    }
    
    if (task.status === 'inprogress') {
      return { icon: Timer, color: 'text-blue-600', text: 'In Progress' };
    }
    
    return { icon: Clock, color: 'text-gray-500', text: 'Pending' };
  };
  
  const statusInfo = getStatusIndicator();
  const StatusIcon = statusInfo.icon;
  
  const handleClick = () => {
    setShowDetailModal(true);
  };

  const handleDeleteTask = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail modal
    try {
      await deleteTask(task.id);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleArchiveTask = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail modal
    try {
      await archiveTask(task.id);
      toast.success('Task archived successfully');
    } catch (error) {
      toast.error('Failed to archive task');
    }
  };
  
  // Format the due date
  const formattedDate = task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date';
  const isPastDue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  
  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="cursor-grab"
    >
      <Card 
        className={cn(
          "h-full transition-all hover:border-ca-blue-light",
          isDragging && "shadow-lg"
        )}
      >
        <CardContent className="p-4 space-y-3" onClick={handleClick}>
          <div className="flex justify-between items-start gap-2">
            <div className="flex gap-2">
              <Badge className={getCategoryBadgeStyles(task.category)}>
                {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
              </Badge>
              <Badge className={getPriorityStyles(task.priority)}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
            </div>
            
            {/* Owner Actions Dropdown */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive Task</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to archive this task? It will be hidden from the main board but can be restored later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchiveTask}>
                          {isArchiving ? 'Archiving...' : 'Archive'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <DropdownMenuSeparator />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete this task? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <h3 className="font-medium text-base line-clamp-2">{task.title}</h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        
          {/* Client Information */}
          {client && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              <Building2 className="h-3 w-3 text-blue-600" />
              <span className="font-medium text-blue-700">{client.name}</span>
            </div>
          )}
          
          {/* Team Members (Assigned + Collaborators) */}
          {allTeamMembers.length > 0 && (
            <div className="space-y-2">
              {/* Primary Assignee */}
              {assignedEmployees.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-purple-50 p-2 rounded">
                  <User className="h-3 w-3 text-purple-600" />
                  <span className="font-medium text-purple-700">
                    Assigned: {assignedEmployees[0].fullName || assignedEmployees[0].email}
                  </span>
                </div>
              )}
              
              {/* Collaborators */}
              {collaborators.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 p-2 rounded">
                  <UserPlus className="h-3 w-3 text-green-600" />
                  <span className="font-medium text-green-700">
                    {collaborators.length === 1 
                      ? `Collaborator: ${collaborators[0].fullName || collaborators[0].email}`
                      : `${collaborators.length} Collaborators`
                    }
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Real-time Status */}
          <div className="flex items-center gap-2 text-xs">
            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
            <span className={`font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </CardContent>
        
        <CardFooter className="px-4 py-2 border-t flex justify-between items-center bg-muted/50">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={cn(
              "text-xs", 
              isPastDue ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              {isPastDue ? 'Overdue: ' : ''}{formattedDate}
            </span>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex -space-x-2">
                  {/* Show assigned employees first, then collaborators */}
                  {allTeamMembers.slice(0, 4).map((employee, index) => {
                    const isAssigned = assignedEmployees.some(emp => emp._id === employee._id);
                    const isCollaborator = collaborators.some(emp => emp._id === employee._id);
                    
                    return (
                      <Avatar key={`avatar-${task.id}-${index}`} className="h-5 w-5 border border-background">
                        <AvatarFallback className={`text-[10px] text-white ${
                          isAssigned ? 'bg-ca-blue' : 'bg-green-500'
                        }`}>
                          {(employee.fullName || employee.email || 'U')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                          }
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                  {allTeamMembers.length > 4 && (
                    <Avatar className="h-5 w-5 border border-background">
                      <AvatarFallback className="text-[10px] bg-gray-400 text-white">
                        +{allTeamMembers.length - 4}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {allTeamMembers.length === 0 && (
                    <Avatar className="h-5 w-5 border border-background">
                      <AvatarFallback className="text-[10px] bg-gray-300 text-gray-600">
                        NA
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  {allTeamMembers.length > 0 ? (
                    <div className="space-y-2">
                      {assignedEmployees.length > 0 && (
                        <div>
                          <p className="font-medium text-purple-600">Assigned:</p>
                          {assignedEmployees.map((emp, index) => (
                            <p key={`tooltip-assigned-${index}`} className="text-sm">
                              {emp.fullName || emp.email}
                            </p>
                          ))}
                        </div>
                      )}
                      {collaborators.length > 0 && (
                        <div>
                          <p className="font-medium text-green-600">Collaborators:</p>
                          {collaborators.map((emp, index) => (
                            <p key={`tooltip-collab-${index}`} className="text-sm">
                              {emp.fullName || emp.email}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>No one assigned</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div 
            className="p-1 rounded-full hover:bg-gray-200 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement edit functionality
              setShowDetailModal(true);
            }}
          >
            <Edit className="h-3 w-3 text-muted-foreground" />
          </div>
        </CardFooter>
      </Card>
      
      <TaskDetailModal 
        task={task}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </div>
  );
};

export default TaskCard;
