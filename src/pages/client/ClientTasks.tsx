
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TaskBoard from '@/components/tasks/TaskBoard';

const ClientTasks = () => {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="space-y-1 bg-gradient-to-r from-ca-green/10 to-transparent">
          <CardTitle className="text-2xl text-ca-green-dark">My Tasks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your ongoing service requests
          </p>
        </CardHeader>
        <CardContent>
          <TaskBoard basePath="/client" />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientTasks;
