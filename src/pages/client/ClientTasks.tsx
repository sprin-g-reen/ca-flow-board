
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import TaskBoard from '@/components/tasks/TaskBoard';

const ClientTasks = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  // In a real app, filter tasks by client ID
  const clientTasks = tasks.filter(task => task.status !== 'completed');
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-ca-green/10 to-transparent p-6 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-ca-green-dark">My Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Track your ongoing service requests
        </p>
      </div>
      <TaskBoard tasks={clientTasks} basePath="/client" />
    </div>
  );
};

export default ClientTasks;
