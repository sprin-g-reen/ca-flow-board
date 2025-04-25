
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TaskBoard from '@/components/tasks/TaskBoard';
import { FormDialog } from '@/components/shared/FormDialog';
import { AddTaskForm } from '@/components/forms/AddTaskForm';
import { toggleModal } from '@/store/slices/uiSlice';

const OwnerTasks = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { modals } = useSelector((state: RootState) => state.ui);
  
  const handleOpenAddTaskModal = () => {
    dispatch(toggleModal({ modal: 'addTask', value: true }));
  };
  
  const handleCloseAddTaskModal = () => {
    dispatch(toggleModal({ modal: 'addTask', value: false }));
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button 
          className="bg-ca-blue hover:bg-ca-blue-dark"
          onClick={handleOpenAddTaskModal}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Task Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage all tasks across your organization
          </p>
        </CardHeader>
        <CardContent>
          <TaskBoard tasks={tasks} basePath="/owner" />
        </CardContent>
      </Card>
      
      <FormDialog
        open={modals.addTask}
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
