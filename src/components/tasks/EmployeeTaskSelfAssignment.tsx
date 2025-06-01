
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Clock, DollarSign } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '@/store/slices/tasksSlice';
import { toast } from 'sonner';

export const EmployeeTaskSelfAssignment = () => {
  const { tasks } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Filter unassigned tasks or tasks with available capacity
  const availableTasks = tasks.filter(task => 
    task.assignedTo.length === 0 || task.assignedTo.length < 2 // Allow up to 2 people per task
  );

  // Apply filters
  const filteredTasks = availableTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesCategory = !categoryFilter || task.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleSelfAssign = async (taskId: string) => {
    try {
      // In a real implementation, you'd call an API to assign the task
      // For now, we'll simulate the assignment
      toast.success('Task assigned to yourself successfully');
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const getCategoryColor = (category: TaskCategory) => {
    switch (category) {
      case 'gst_filing': return 'bg-blue-100 text-blue-800';
      case 'itr_filing': return 'bg-purple-100 text-purple-800';
      case 'roc_filing': return 'bg-indigo-100 text-indigo-800';
      case 'other': return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Tasks for Self-Assignment</CardTitle>
          <p className="text-sm text-gray-600">
            Browse and assign yourself to available tasks
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="gst_filing">GST Filing</SelectItem>
                <SelectItem value="itr_filing">ITR Filing</SelectItem>
                <SelectItem value="roc_filing">ROC Filing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{task.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                    </div>
                    <Button 
                      onClick={() => handleSelfAssign(task.id)}
                      size="sm"
                      className="ml-4"
                    >
                      Assign to Me
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>Client: <strong>{task.clientName}</strong></span>
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDueDate(task.dueDate)}</span>
                      </div>
                    )}
                    {task.isPayableTask && task.price && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>₹{task.price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </Badge>
                    <Badge className={getCategoryColor(task.category)}>
                      {task.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    <Badge variant="outline">
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                    {task.assignedTo.length > 0 && (
                      <Badge variant="secondary">
                        {task.assignedTo.length} assigned
                      </Badge>
                    )}
                  </div>

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Subtasks:</p>
                      <div className="space-y-1">
                        {task.subtasks.slice(0, 3).map((subtask, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${subtask.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>{subtask.title}</span>
                          </div>
                        ))}
                        {task.subtasks.length > 3 && (
                          <p className="text-sm text-gray-500">+{task.subtasks.length - 3} more subtasks</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No available tasks found</p>
                <p className="text-sm">Try adjusting your filters or check back later</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
