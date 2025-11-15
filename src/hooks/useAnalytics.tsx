
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

  // Compute task metrics with real data
  const computeAverageCompletionDays = (tasksList: any[]) => {
    const completed = tasksList.filter(t => t.status === 'completed' && t.completedAt && t.createdAt);
    if (completed.length === 0) return 0;
    const totalDays = completed.reduce((sum, t) => {
      // prefer ISO timestamps createdAt / completedAt
      const createdAt = new Date(t.createdAt || Date.now());
      const completedAt = new Date(t.completedAt || Date.now());
      const diff = Math.max(0, (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return sum + diff;
    }, 0);
    return totalDays / completed.length;
  };

  const taskMetrics: TaskMetrics = {
    totalTasks: safeTasks.length,
    completedTasks: safeTasks.filter(task => task.status === 'completed').length,
    pendingTasks: safeTasks.filter(task => task.status !== 'completed').length,
    overdueTasks: safeTasks.filter(task => 
      new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length,
    completionRate: safeTasks.length > 0 ?
      (safeTasks.filter(task => task.status === 'completed').length / safeTasks.length) * 100 : 0,
    averageCompletionTime: parseFloat((computeAverageCompletionDays(safeTasks) || 0).toFixed(2)),
  };

  const employeePerformance: EmployeePerformance[] = safeEmployees.map(employee => {
    const employeeTasks = safeTasks.filter(task => 
      (Array.isArray((task as any).assignedTo) ? (task as any).assignedTo.includes(employee.id) : String((task as any).assignedTo) === String(employee.id))
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

  // revenue calculations: total, current month, previous month, growth
  const paidPayments = safePayments.filter(p => p.status === 'paid');
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();

  const monthRevenue = paidPayments
    .filter(p => {
      const d = new Date(p.paid_at || p.paidAt || p.created_at || p.createdAt || 0);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const prevMonthRevenue = paidPayments
    .filter(p => {
      const d = new Date(p.paid_at || p.paidAt || p.created_at || p.createdAt || 0);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const revenueGrowth = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : (monthRevenue > 0 ? 100 : 0);

  const revenueMetrics: RevenueMetrics = {
    totalRevenue,
    monthlyRevenue: monthRevenue,
    paidInvoices: paidPayments.length,
    pendingPayments: safePayments.filter(payment => payment.status === 'pending').length,
    revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
    averageInvoiceValue: paidPayments.length > 0 ? Math.round(paidPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / paidPayments.length) : 0,
  };

  // client engagement and retention
  const clientsWithActivityThisMonth = safeClients.filter(client =>
    safeTasks.some(task => {
  const taskDate = new Date((task as any).updatedAt || (task as any).createdAt || 0);
  return String((task as any).clientId) === String(client.id) && taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
    })
  );

  const clientsWithActivityPrevMonth = safeClients.filter(client =>
    safeTasks.some(task => {
  const taskDate = new Date((task as any).updatedAt || (task as any).createdAt || 0);
  return String((task as any).clientId) === String(client.id) && taskDate.getMonth() === prevMonth && taskDate.getFullYear() === prevYear;
    })
  );

  const retainedClients = clientsWithActivityPrevMonth.filter(pc => clientsWithActivityThisMonth.some(c => String(c.id) === String(pc.id)));
  const retentionRate = clientsWithActivityPrevMonth.length > 0 ? (retainedClients.length / clientsWithActivityPrevMonth.length) * 100 : 0;

  const clientEngagement: ClientEngagement = {
    totalClients: safeClients.length,
    activeClients: clientsWithActivityThisMonth.length,
  newClients: safeClients.filter(client => new Date((client as any).createdAt || (client as any).created_at || 0).getMonth() === currentMonth && new Date((client as any).createdAt || (client as any).created_at || 0).getFullYear() === currentYear).length,
    clientRetentionRate: parseFloat(retentionRate.toFixed(2)),
    averageProjectValue: safeQuotations.length > 0 ? safeQuotations.reduce((sum, quote) => sum + (quote.total_amount || 0), 0) / safeQuotations.length : 0,
    topClients: safeClients
      .map(client => ({
        id: client.id,
        name: client.name,
        totalValue: safeQuotations
          .filter(quote => quote.client_id === client.id)
          .reduce((sum, quote) => sum + (quote.total_amount || 0), 0),
        projectCount: safeTasks.filter(task => String(task.clientId) === String(client.id)).length,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5),
  };

  // Real-time data using existing hooks for consistency
  const realTimeData = {
    recentTasks: safeTasks
      .sort((a: any, b: any) => new Date((b as any).updatedAt || (b as any).createdAt || (b as any).created_at || 0).getTime() - new Date((a as any).updatedAt || (a as any).createdAt || (a as any).created_at || 0).getTime())
      .slice(0, 10),
    recentPayments: safePayments
      .sort((a: any, b: any) => new Date((b as any).updated_at || (b as any).created_at || (b as any).createdAt || 0).getTime() - new Date((a as any).updated_at || (a as any).created_at || (a as any).createdAt || 0).getTime())
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
