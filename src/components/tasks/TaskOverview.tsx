import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Building2, Tag, AlertCircle, CheckCircle2, Edit, Trash2, Archive, UserPlus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Task } from '@/store/slices/tasksSlice';
import { useClients } from '@/hooks/useClients';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TaskOverviewProps {
  task: Task;
  client?: any;
  assignedEmployees?: any[];
  onClose?: () => void;
}

export default function TaskOverview({ task, client, assignedEmployees = [], onClose }: TaskOverviewProps) {
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isTeamEditDialogOpen, setIsTeamEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(
    task.clientId || (client?.id || client?._id) || ''
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    assignedEmployees.length > 0 ? assignedEmployees[0]._id : ''
  );
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(task.collaborators || []);

  const { clients, isLoading: isLoadingClients } = useClients();
  const { employees, isLoading: isLoadingEmployees } = useEmployees();
  const { updateTask, updateTaskAsync, isUpdatingTask, deleteTask, isDeleting, archiveTask, isArchiving, refreshTasks } = useTasks();
  const { user } = useAuth();
  
  // Check if user is owner
  const isOwner = user?.role === 'owner';
  
  // Get collaborators data
  const collaborators = employees?.filter(emp => 
    task.collaborators?.includes(emp._id)
  ) || [];
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  const handleUpdateClient = async () => {
    if (selectedClientId !== task.clientId) {
      try {
        await updateTask({
          taskId: task.id,
          updates: { client_id: selectedClientId === 'none' ? undefined : selectedClientId }
        });
        
        // Close dialog first
        setIsClientDialogOpen(false);
        
        // Show success toast
        toast.success('Client assignment updated successfully');
        
        // Force refresh tasks to get latest data
        refreshTasks();
        
        // Close the entire modal so user sees the updated task card
        setTimeout(() => {
          onClose?.();
        }, 800);
      } catch (error) {
        toast.error('Failed to update client assignment');
      }
    } else {
      setIsClientDialogOpen(false);
    }
  };

  const handleUpdateEmployee = async () => {
    const currentEmployeeId = assignedEmployees.length > 0 ? assignedEmployees[0]._id : '';
    const hasChanges = selectedEmployeeId !== currentEmployeeId || 
                       JSON.stringify(selectedCollaborators) !== JSON.stringify(task.collaborators || []);
    
    if (hasChanges) {
      try {
        console.log('Updating team with:', {
          selectedEmployeeId,
          selectedCollaborators,
          currentEmployeeId
        });
        
        const updates: any = {};
        
        // Only include assignedTo if it has changed
        if (selectedEmployeeId !== currentEmployeeId) {
          updates.assignedTo = selectedEmployeeId && selectedEmployeeId !== 'unassigned' ? selectedEmployeeId : null;
        }
        
        // Only include collaborators if they have changed
        if (JSON.stringify(selectedCollaborators) !== JSON.stringify(task.collaborators || [])) {
          updates.collaborators = selectedCollaborators;
        }
        
        console.log('Sending updates:', updates);
        
        const result = await updateTaskAsync({
          taskId: task.id,
          updates
        });
        
        console.log('Update result:', result);
        
        // Show success toast
        toast.success('Team assignment updated successfully');
        
        // Force refresh tasks to get latest data
        await refreshTasks();
        
        // Close dialog
        setIsTeamEditDialogOpen(false);
        
        // Close the entire modal so user sees the updated task card
        setTimeout(() => {
          onClose?.();
        }, 300);
      } catch (error) {
        console.error('Failed to update team:', error);
        toast.error('Failed to update team assignment');
      }
    } else {
      setIsTeamEditDialogOpen(false);
    }
  };

  const addCollaborator = (employeeId: string) => {
    if (!selectedCollaborators.includes(employeeId) && employeeId !== selectedEmployeeId) {
      setSelectedCollaborators([...selectedCollaborators, employeeId]);
    }
  };

  const removeCollaborator = (employeeId: string) => {
    setSelectedCollaborators(selectedCollaborators.filter(id => id !== employeeId));
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask(task.id);
      toast.success('Task deleted successfully');
      onClose?.(); // Close the modal after deletion
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleArchiveTask = async () => {
    try {
      await archiveTask(task.id);
      toast.success('Task archived successfully');
      onClose?.(); // Close the modal after archiving
    } catch (error) {
      toast.error('Failed to archive task');
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Task Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Task Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {task.description || 'No description provided'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Category</h4>
              <Badge variant="secondary" className="capitalize">
                {task.category}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Priority</h4>
              <Badge 
                className={
                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline & Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm text-gray-600">
                  {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Due Date:</span>
                  <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </span>
                  {isOverdue && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm font-medium">Status:</span>
                <Badge 
                  className={
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'inprogress' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'review' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }
                >
                  {task.status === 'inprogress' ? 'In Progress' : 
                   task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment & Client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Client Information
              </div>
              <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Client Assignment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-select">Select Client</Label>
                      <Select 
                        value={selectedClientId || 'none'} 
                        onValueChange={setSelectedClientId}
                        disabled={isLoadingClients}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a client..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="none">No Client</SelectItem>
                          {clients && clients.length > 0 ? (
                            clients.map((c) => (
                              <SelectItem key={c.id || c._id} value={c.id || c._id}>
                                {c.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              No clients available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsClientDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateClient}
                        disabled={isUpdatingTask}
                      >
                        {isUpdatingTask ? 'Updating...' : 'Update Client'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client ? (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{client.name}</h4>
                  <p className="text-sm text-gray-600">{client.email}</p>
                </div>
                
                {client.phone && (
                  <div>
                    <span className="text-sm font-medium">Phone: </span>
                    <span className="text-sm text-gray-600">{client.phone}</span>
                  </div>
                )}
                
                {client.gstNumber && (
                  <div>
                    <span className="text-sm font-medium">GST: </span>
                    <span className="text-sm text-gray-600">{client.gstNumber}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No client assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Assigned Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assigned Team
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsTeamEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Primary Assignee */}
              {assignedEmployees.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Primary Assignee</h4>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-purple-500 text-white text-sm">
                        {(assignedEmployees[0].fullName || assignedEmployees[0].email || 'U')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {assignedEmployees[0].fullName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">{assignedEmployees[0].email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        employee
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Collaborators</h4>
                  <div className="space-y-2">
                    {collaborators.map((collaborator) => (
                      <div key={collaborator._id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-green-500 text-white text-sm">
                            {(collaborator.fullName || collaborator.email || 'U')
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {collaborator.fullName || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">{collaborator.email}</p>
                          <Badge variant="outline" className="text-xs mt-1 bg-green-100 text-green-700">
                            collaborator
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignedEmployees.length === 0 && collaborators.length === 0 && (
                <p className="text-gray-500 text-center py-4">No team members assigned</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Information */}
      {task.isPayableTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payable Task:</span>
              <Badge className="bg-green-100 text-green-800">Yes</Badge>
            </div>
            
            {task.price && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-lg font-semibold text-green-600">
                  ₹{task.price.toLocaleString()}
                </span>
              </div>
            )}
            
            {task.payableTaskType && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Type:</span>
                <span className="text-sm text-gray-600">{task.payableTaskType}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Owner Actions */}
      {isOwner && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Tag className="h-5 w-5" />
              Owner Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-orange-700 mb-4">
              As an owner, you can archive or permanently delete this task.
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                disabled={isArchiving || isDeleting}
                onClick={() => setIsArchiveDialogOpen(true)}
              >
                <Archive className="h-4 w-4" />
                Archive Task
              </Button>

              <Button 
                variant="destructive" 
                className="flex items-center gap-2"
                disabled={isArchiving || isDeleting}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this task? Archived tasks can be restored later but will be hidden from the main task board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchiveTask}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isArchiving ? 'Archiving...' : 'Archive Task'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this task? This action cannot be undone and all associated data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Team Edit Dialog */}
      <Dialog open={isTeamEditDialogOpen} onOpenChange={setIsTeamEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="text-xl">Edit Team Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto flex-1 px-6 py-2">
            {/* Primary Assignee */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900">Primary Assignee</Label>
              <Select 
                value={selectedEmployeeId} 
                onValueChange={setSelectedEmployeeId}
                disabled={isLoadingEmployees}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select primary assignee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No Primary Assignee</SelectItem>
                  {employees?.filter(emp => !selectedCollaborators.includes(emp._id))
                    .map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Collaborators */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900">Collaborators</Label>
              
              {/* Selected Collaborators */}
              {selectedCollaborators.length > 0 && (
                <div className="space-y-3">
                  {selectedCollaborators.map((collaboratorId) => {
                    const collaborator = employees?.find(emp => emp._id === collaboratorId);
                    return (
                      <div key={collaboratorId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-green-500 text-white text-xs">
                              {(collaborator?.fullName || collaborator?.email || 'U')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {collaborator?.fullName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{collaborator?.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCollaborator(collaboratorId)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Collaborator */}
              <div className="mt-3">
                <Select 
                  onValueChange={(value) => {
                    if (value && value !== 'none') {
                      addCollaborator(value);
                    }
                  }}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Add collaborator..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a collaborator to add</SelectItem>
                    {employees?.filter(emp => 
                      !selectedCollaborators.includes(emp._id) && emp._id !== selectedEmployeeId
                    ).map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          {emp.fullName} ({emp.email})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Collaborators can view and work on this task alongside the primary assignee
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setIsTeamEditDialogOpen(false)}
              className="px-4"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateEmployee}
              disabled={isUpdatingTask}
              className="px-6"
            >
              {isUpdatingTask ? 'Updating...' : 'Update Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}