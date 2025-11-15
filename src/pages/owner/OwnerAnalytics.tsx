
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RealTimeTaskMonitor } from '@/components/dashboard/RealTimeTaskMonitor';
import { EmployeePerformanceMetrics } from '@/components/dashboard/EmployeePerformanceMetrics';
import { RevenueTracker } from '@/components/dashboard/RevenueTracker';
import { ClientEngagementAnalytics } from '@/components/dashboard/ClientEngagementAnalytics';
import { DatabaseLogs } from '@/components/analytics/DatabaseLogs';
import { BarChart, Users, DollarSign, UserCheck, Database } from 'lucide-react';

const OwnerAnalytics = () => {
  const [timeRange, setTimeRange] = useState('year');
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Real-Time Tasks
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee Performance
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue Tracking
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Client Engagement
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Real-Time Task Monitoring
              </CardTitle>
              <CardDescription>
                Live monitoring of task progress, completion rates, and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealTimeTaskMonitor />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Performance Metrics
              </CardTitle>
              <CardDescription>
                Detailed analysis of employee productivity, efficiency, and workload distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeePerformanceMetrics />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Tracking & Financial Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive revenue analysis from payable tasks and payment tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueTracker />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Client Engagement Analytics
              </CardTitle>
              <CardDescription>
                Client relationship insights, engagement levels, and business growth metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientEngagementAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <DatabaseLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerAnalytics;
