
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TaskBoard from '@/components/tasks/TaskBoard';

const EmployeeTasks = () => {
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
          <TaskBoard basePath="/employee" />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeTasks;
