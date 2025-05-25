
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TaskBoard from '@/components/tasks/TaskBoard';
import { useTasks } from '@/hooks/useTasks';

const EmployeeTasks = () => {
  const { tasks, isLoading } = useTasks();
  
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ca-blue"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="space-y-1 bg-gradient-to-r from-purple-100 to-transparent">
          <CardTitle className="text-2xl text-purple-900">My Tasks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your assigned tasks and deadlines
          </p>
        </CardHeader>
        <CardContent>
          <TaskBoard tasks={tasks} basePath="/employee" />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeTasks;
