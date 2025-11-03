import { useState } from 'react';
import { X, FileText, MessageSquare, Receipt, Quote, User, Building2, Calendar, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Task } from '@/store/slices/tasksSlice';
import { useEmployees } from '@/hooks/useEmployees';
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Import tab components (we'll create these)
import TaskOverview from './TaskOverview';
import TaskDocuments from './TaskDocuments';
import TaskChat from './TaskChat';
import { TaskInvoicing } from './TaskInvoicing';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'inprogress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'review':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'todo':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export default function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { employees } = useEmployees();
  const { clients } = useClients();

  if (!task) return null;

  // Get real client and employee data
  const client = clients?.find(c => c.id === task.clientId);
  const assignedEmployees = employees?.filter(emp => 
    task.assignedTo.includes(emp._id)
  ) || [];

  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {task.title}
                </DialogTitle>
                <Badge className={getPriorityStyles(task.priority)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </Badge>
                <Badge className={getStatusStyles(task.status)}>
                  {task.status === 'inprogress' ? 'In Progress' : 
                   task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </Badge>
                {isOverdue && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Overdue
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {client && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{client.name}</span>
                  </div>
                )}
                
                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                
                {assignedEmployees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1">
                        {assignedEmployees.slice(0, 3).map((employee) => (
                          <Avatar key={employee._id} className="h-6 w-6 border-2 border-white">
                            <AvatarFallback className="text-xs bg-blue-500 text-white">
                              {(employee.fullName || employee.email || 'U')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                              }
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="ml-2">
                        {assignedEmployees.length === 1 
                          ? assignedEmployees[0].fullName || assignedEmployees[0].email
                          : `${assignedEmployees.length} assigned`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 bg-gray-50 m-0 rounded-none">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="invoicing" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Invoicing
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="overview" className="h-full m-0">
                <TaskOverview 
                  task={task} 
                  client={client} 
                  assignedEmployees={assignedEmployees} 
                  onClose={() => onOpenChange(false)}
                />
              </TabsContent>
              
              <TabsContent value="documents" className="h-full m-0">
                <TaskDocuments task={task} />
              </TabsContent>
              
              <TabsContent value="chat" className="h-full m-0">
                <TaskChat task={task} />
              </TabsContent>
              
              <TabsContent value="invoicing" className="h-full m-0">
                <TaskInvoicing task={task} client={client} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}