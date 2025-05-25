
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, CheckSquare, Users, MessageSquare } from "lucide-react"

const EmployeeDashboard = () => {
  const { name } = useSelector((state: RootState) => state.auth);

  const stats = [
    {
      title: "My Tasks",
      value: "12",
      icon: CheckSquare,
      color: "text-purple-600"
    },
    {
      title: "Due Today",
      value: "3",
      icon: CalendarDays,
      color: "text-orange-600"
    },
    {
      title: "Clients",
      value: "8",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Messages",
      value: "5",
      icon: MessageSquare,
      color: "text-green-600"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {name || 'Employee'}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your tasks today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your recently updated tasks will appear here.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Tasks due soon will be shown here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
