
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload, Search, Filter } from 'lucide-react';
import TaskBoard from '@/components/tasks/TaskBoard';
import { FormDialog } from '@/components/shared/FormDialog';
import { AddTaskForm } from '@/components/forms/AddTaskForm';
import { useTasks } from '@/hooks/useTasks';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from 'sonner';

const OwnerTasks = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const { tasks, isLoading, error } = useTasks();
  const { employees = [] } = useEmployees();

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    // Assigned To filter
    if (assignedToFilter !== 'all') {
      if (assignedToFilter === 'unassigned') {
        filtered = filtered.filter(task => !task.assignedTo || (Array.isArray(task.assignedTo) && task.assignedTo.length === 0));
      } else {
        filtered = filtered.filter(task => {
          if (Array.isArray(task.assignedTo)) {
            return task.assignedTo.some((user: any) => 
              (typeof user === 'string' ? user : user._id || user.id) === assignedToFilter
            );
          }
          return false;
        });
      }
    }

    return filtered;
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter, assignedToFilter]);

  // Get task counts for tabs
  const taskCounts = useMemo(() => {
    return {
      all: tasks.length,
      gst: tasks.filter(t => t.category === 'gst').length,
      itr: tasks.filter(t => t.category === 'itr').length,
      roc: tasks.filter(t => t.category === 'roc').length,
      other: tasks.filter(t => t.category === 'other').length,
    };
  }, [tasks]);
  
  const handleOpenAddTaskModal = () => {
    setShowAddTask(true);
  };
  
  const handleCloseAddTaskModal = () => {
    setShowAddTask(false);
  };

  const handleExportTasks = () => {
    try {
      const exportData = tasks.map(task => ({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        client_name: task.clientName,
        due_date: task.dueDate,
        created_at: task.createdAt,
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Tasks exported successfully');
    } catch (error) {
      toast.error('Failed to export tasks');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ca-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Error loading tasks. Please try again.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleExportTasks}
            disabled={tasks.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button 
            className="bg-ca-blue hover:bg-ca-blue-dark"
            onClick={handleOpenAddTaskModal}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>
      
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent pb-6">
          <CardTitle className="text-2xl">Task Management</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all tasks across your organization ({tasks.length} total)
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Filter Tabs */}
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                Tasks ({taskCounts.all})
              </TabsTrigger>
              <TabsTrigger value="itr" className="flex items-center gap-2">
                ITR {taskCounts.itr > 0 && <Badge variant="secondary" className="ml-1">{taskCounts.itr}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-2">
                Other Task {taskCounts.other > 0 && <Badge variant="secondary" className="ml-1">{taskCounts.other}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="roc" className="flex items-center gap-2">
                ROC {taskCounts.roc > 0 && <Badge variant="secondary" className="ml-1">{taskCounts.roc}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="gst" className="flex items-center gap-2">
                GST {taskCounts.gst > 0 && <Badge variant="secondary" className="ml-1">{taskCounts.gst}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* Search and Filter Bar */}
            <div className="bg-gray-50 p-4 rounded-lg border mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tasks by title, description, or client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="inprogress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Assigned To" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          {employee.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assignedToFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                        setAssignedToFilter('all');
                      }}
                      className="whitespace-nowrap"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Active Filters Summary */}
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || assignedToFilter !== 'all') && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="h-4 w-4" />
                  <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
                </div>
              )}
            </div>

            <TabsContent value="all" className="mt-0">
              <TaskBoard tasks={filteredTasks} basePath="/owner" />
            </TabsContent>
            
            <TabsContent value="itr" className="mt-0">
              <TaskBoard tasks={filteredTasks} basePath="/owner" />
            </TabsContent>
            
            <TabsContent value="other" className="mt-0">
              <TaskBoard tasks={filteredTasks} basePath="/owner" />
            </TabsContent>
            
            <TabsContent value="roc" className="mt-0">
              <TaskBoard tasks={filteredTasks} basePath="/owner" />
            </TabsContent>
            
            <TabsContent value="gst" className="mt-0">
              <TaskBoard tasks={filteredTasks} basePath="/owner" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <FormDialog
        open={showAddTask}
        onOpenChange={handleCloseAddTaskModal}
        title="Create New Task"
        description="Add a task for your team to work on"
        showFooter={false}
      >
        <AddTaskForm onSuccess={handleCloseAddTaskModal} />
      </FormDialog>
    </div>
  );
};

export default OwnerTasks;
