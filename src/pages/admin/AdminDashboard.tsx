
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const AdminDashboard = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  const widgets = [
    {
      id: "task-overview",
      content: (
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
            <CardTitle>Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Total Tasks: {tasks.length}</div>
              <div>Active Tasks: {tasks.filter(t => t.status !== 'completed').length}</div>
              <div>Completed Tasks: {tasks.filter(t => t.status === 'completed').length}</div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "recent-activity",
      content: (
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              No recent activity
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  // Function to move widgets (required by DashboardWidget)
  const moveWidget = (dragIndex: number, hoverIndex: number) => {
    // In a real implementation, this would update the widget order
    console.log(`Moving widget from index ${dragIndex} to ${hoverIndex}`);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
          <CardTitle className="text-2xl text-ca-blue-dark">Admin Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground">
            Overview of system performance and recent activities
          </p>
        </CardHeader>
        <CardContent>
          <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {widgets.map((widget, index) => (
                <DashboardWidget
                  key={widget.id}
                  id={widget.id}
                  index={index}
                  moveWidget={moveWidget}
                >
                  {widget.content}
                </DashboardWidget>
              ))}
            </div>
          </DndProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
