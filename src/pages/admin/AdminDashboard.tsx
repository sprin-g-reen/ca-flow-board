
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { AddWidgetButton } from "@/components/dashboard/AddWidgetButton";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const AdminDashboard = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // Define initial widgets
  const initialWidgets = [
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
    {
      id: "performance-metrics",
      content: (
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-ca-green/10 to-transparent">
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Average Completion Time: 3.2 days</div>
              <div>Tasks Completed This Week: 12</div>
              <div>On-time Delivery Rate: 94%</div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "system-status",
      content: (
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Server Status:</span>
                <span className="text-ca-green">Online</span>
              </div>
              <div className="flex justify-between">
                <span>Database Health:</span>
                <span className="text-ca-green">Good</span>
              </div>
              <div className="flex justify-between">
                <span>Last Backup:</span>
                <span>2 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];
  
  // State to manage widgets
  const [widgets, setWidgets] = useState(initialWidgets);
  
  // Function to move widgets
  const moveWidget = (dragIndex: number, hoverIndex: number) => {
    const newWidgets = [...widgets];
    const draggedWidget = newWidgets.splice(dragIndex, 1)[0];
    newWidgets.splice(hoverIndex, 0, draggedWidget);
    setWidgets(newWidgets);
  };
  
  // Function to remove a widget
  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter(widget => widget.id !== widgetId));
  };
  
  // Function to add a new widget
  const handleAddWidget = (widgetType: string) => {
    // Create different widget content based on type
    let newWidget;
    
    switch (widgetType) {
      case 'revenue':
        newWidget = {
          id: `revenue-${Date.now()}`,
          content: (
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total Revenue: $125,000</div>
                  <div>Monthly Growth: +12%</div>
                  <div>Projected Q4: $180,000</div>
                </div>
              </CardContent>
            </Card>
          )
        };
        break;
      
      case 'tasks':
        newWidget = {
          id: `tasks-${Date.now()}`,
          content: (
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-ca-green/10 to-transparent">
                <CardTitle>Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>High Priority: {tasks.filter(t => t.priority === 'high').length}</div>
                  <div>Medium Priority: {tasks.filter(t => t.priority === 'medium').length}</div>
                  <div>Low Priority: {tasks.filter(t => t.priority === 'low').length}</div>
                </div>
              </CardContent>
            </Card>
          )
        };
        break;
      
      case 'clients':
        newWidget = {
          id: `clients-${Date.now()}`,
          content: (
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-ca-yellow/10 to-transparent">
                <CardTitle>Client Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total Clients: 24</div>
                  <div>Active Projects: 18</div>
                  <div>Client Satisfaction: 4.8/5</div>
                </div>
              </CardContent>
            </Card>
          )
        };
        break;
        
      case 'employees':
        newWidget = {
          id: `employees-${Date.now()}`,
          content: (
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-ca-blue/10 to-transparent">
                <CardTitle>Employee Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Total Employees: 42</div>
                  <div>Active: 38</div>
                  <div>On Leave: 4</div>
                  <div>Avg. Workload: 87%</div>
                </div>
              </CardContent>
            </Card>
          )
        };
        break;
        
      default:
        return;
    }
    
    // Add the new widget to state
    setWidgets([...widgets, newWidget]);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-ca-blue/10 to-transparent">
          <div>
            <CardTitle className="text-2xl text-ca-blue-dark">Admin Dashboard</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Overview of system performance and recent activities
            </CardDescription>
          </div>
          <AddWidgetButton onAddWidget={handleAddWidget} />
        </CardHeader>
        <CardContent>
          <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {widgets.map((widget, index) => (
                <DashboardWidget
                  key={widget.id}
                  id={widget.id}
                  index={index}
                  moveWidget={moveWidget}
                  onRemove={handleRemoveWidget}
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
