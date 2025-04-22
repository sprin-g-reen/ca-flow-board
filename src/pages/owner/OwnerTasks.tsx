
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import TaskBoard from '@/components/tasks/TaskBoard';

const OwnerTasks = () => {
  // Owner can see all tasks
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Task Management</h1>
      <p className="text-muted-foreground">
        Manage all tasks across your organization
      </p>
      <TaskBoard tasks={tasks} basePath="/owner" />
    </div>
  );
};

export default OwnerTasks;
