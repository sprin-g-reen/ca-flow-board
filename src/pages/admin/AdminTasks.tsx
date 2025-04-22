
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import TaskBoard from '@/components/tasks/TaskBoard';

const AdminTasks = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-ca-blue/10 to-transparent p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-ca-blue-dark">Task Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor employee tasks
        </p>
      </div>
      <TaskBoard tasks={tasks} basePath="/admin" />
    </div>
  );
};

export default AdminTasks;
