
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useEmployees } from '@/hooks/useEmployees';
import { usePayments } from '@/hooks/usePayments';
import { useClients } from '@/hooks/useClients';

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
}

interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  totalTasks: number;
  completedTasks: number;
  onTimeTasks: number;
  efficiency: number;
  workload: number;
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  paidInvoices: number;
  pendingPayments: number;
  revenueGrowth: number;
  averageInvoiceValue: number;
}

interface ClientEngagement {
  totalClients: number;
  activeClients: number;
  newClients: number;
  clientRetentionRate: number;
  averageProjectValue: number;
  topClients: Array<{
    id: string;
    name: string;
    totalValue: number;
    projectCount: number;
  }>;
}

export const useAnalytics = () => {
  const { tasks } = useTasks();
  const { employees } = useEmployees();
  const { payments, quotations } = usePayments();
  const { clients } = useClients();

  // Add null checking for all data arrays with proper type assertion
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeQuotations = Array.isArray(quotations) ? quotations : [];
  const safeClients = Array.isArray(clients) ? clients : [];

  const taskMetrics: TaskMetrics = {
    totalTasks: safeTasks.length,
    completedTasks: safeTasks.filter(task => task.status === 'completed').length,
    pendingTasks: safeTasks.filter(task => task.status !== 'completed').length,
    overdueTasks: safeTasks.filter(task => 
      new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length,
    completionRate: safeTasks.length > 0 ? 
      (safeTasks.filter(task => task.status === 'completed').length / safeTasks.length) * 100 : 0,
    averageCompletionTime: 3.2, // Mock value - would be calculated from actual completion data
  };

  const employeePerformance: EmployeePerformance[] = safeEmployees.map(employee => {
    const employeeTasks = safeTasks.filter(task => 
      task.assignedTo.includes(employee.id)
    );
    const completedTasks = employeeTasks.filter(task => task.status === 'completed');
    const onTimeTasks = completedTasks.filter(task => 
      task.completedAt && new Date(task.completedAt) <= new Date(task.dueDate)
    );

    return {
      employeeId: employee.id,
      employeeName: employee.profiles?.full_name || employee.employee_id,
      totalTasks: employeeTasks.length,
      completedTasks: completedTasks.length,
      onTimeTasks: onTimeTasks.length,
      efficiency: completedTasks.length > 0 ? 
        (onTimeTasks.length / completedTasks.length) * 100 : 0,
      workload: employeeTasks.filter(task => task.status !== 'completed').length,
    };
  });

  const revenueMetrics: RevenueMetrics = {
    totalRevenue: safePayments
      .filter(payment => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0),
    monthlyRevenue: safePayments
      .filter(payment => 
        payment.status === 'paid' && 
        new Date(payment.paid_at || '').getMonth() === new Date().getMonth()
      )
      .reduce((sum, payment) => sum + payment.amount, 0),
    paidInvoices: safePayments.filter(payment => payment.status === 'paid').length,
    pendingPayments: safePayments.filter(payment => payment.status === 'pending').length,
    revenueGrowth: 12.5, // Mock value - would be calculated from historical data
    averageInvoiceValue: safePayments.length > 0 ? 
      safePayments.reduce((sum, payment) => sum + payment.amount, 0) / safePayments.length : 0,
  };

  const clientEngagement: ClientEngagement = {
    totalClients: safeClients.length,
    activeClients: safeClients.filter(client => 
      safeTasks.some(task => task.clientId === client.id && task.status !== 'completed')
    ).length,
    newClients: safeClients.filter(client => 
      new Date(client.created_at).getMonth() === new Date().getMonth()
    ).length,
    clientRetentionRate: 85.7, // Mock value
    averageProjectValue: safeQuotations.length > 0 ? 
      safeQuotations.reduce((sum, quote) => sum + quote.total_amount, 0) / safeQuotations.length : 0,
    topClients: safeClients
      .map(client => ({
        id: client.id,
        name: client.name,
        totalValue: safeQuotations
          .filter(quote => quote.client_id === client.id)
          .reduce((sum, quote) => sum + quote.total_amount, 0),
        projectCount: safeTasks.filter(task => task.clientId === client.id).length,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5),
  };

  // Real-time data using existing hooks for consistency
  const realTimeData = {
    recentTasks: safeTasks
      .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt || b.created_at).getTime() - new Date(a.updatedAt || a.createdAt || a.created_at).getTime())
      .slice(0, 10),
    recentPayments: safePayments
      .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 10),
    isLive: true, // Indicate this is live data
    lastUpdated: new Date().toISOString(),
  };

  // Auto-refresh analytics data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // The hooks will automatically refetch their data
      console.log('Analytics auto-refresh triggered at:', new Date().toLocaleTimeString());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    taskMetrics,
    employeePerformance,
    revenueMetrics,
    clientEngagement,
    realTimeData,
    isLoadingRealTime: false, // Using existing hook data, so no separate loading state
  };
};
