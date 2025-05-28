
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import TaskBoard from '@/components/tasks/TaskBoard';
import { FormDialog } from '@/components/shared/FormDialog';
import { AddTaskForm } from '@/components/forms/AddTaskForm';
import { useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';

const OwnerTasks = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const { tasks, isLoading, error } = useTasks();
  
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
        client_name: task.client_name,
        due_date: task.due_date,
        created_at: task.created_at,
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
        <CardContent className="py-6">
          <TaskBoard tasks={tasks} basePath="/owner" />
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
