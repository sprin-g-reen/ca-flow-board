
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TaskBoard from '@/components/tasks/TaskBoard';
import { FormDialog } from '@/components/shared/FormDialog';
import { AddTaskForm } from '@/components/forms/AddTaskForm';
import { useState } from "react";

const AdminTasks = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Button 
          className="bg-ca-blue hover:bg-ca-blue-dark"
          onClick={() => setShowAddTask(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      
      <Card>
        <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
          <CardTitle className="text-2xl text-ca-blue-dark">Task Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage and monitor employee tasks
          </p>
        </CardHeader>
        <CardContent>
          <TaskBoard basePath="/admin" />
        </CardContent>
      </Card>
      
      <FormDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        title="Create New Task"
        description="Add a task for your team to work on"
        showFooter={false}
      >
        <AddTaskForm onSuccess={() => setShowAddTask(false)} />
      </FormDialog>
    </div>
  );
};

export default AdminTasks;
