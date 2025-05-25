
import { Provider } from 'react-redux';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from './store';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DashboardLayout from './components/layout/DashboardLayout';

// Owner routes
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerTasks from './pages/owner/OwnerTasks';
import OwnerClients from './pages/owner/OwnerClients';
import OwnerEmployees from './pages/owner/OwnerEmployees';
import OwnerInvoices from './pages/owner/OwnerInvoices';
import OwnerCalendar from './pages/owner/OwnerCalendar';
import OwnerAnalytics from './pages/owner/OwnerAnalytics';
import OwnerSettings from './pages/owner/OwnerSettings';

// Admin routes
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTasks from './pages/admin/AdminTasks';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Employee routes
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeTasks from './pages/employee/EmployeeTasks';

// Client routes
import ClientTasks from './pages/client/ClientTasks';

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Owner routes */}
              <Route path="/owner" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="tasks" element={<OwnerTasks />} />
                <Route path="clients" element={<OwnerClients />} />
                <Route path="employees" element={<OwnerEmployees />} />
                <Route path="invoices" element={<OwnerInvoices />} />
                <Route path="calendar" element={<OwnerCalendar />} />
                <Route path="analytics" element={<OwnerAnalytics />} />
                <Route path="settings" element={<OwnerSettings />} />
              </Route>
              
              {/* Super Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="employees" element={<AdminEmployees />} />
                <Route path="invoices" element={<AdminInvoices />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>
              
              {/* Employee routes */}
              <Route path="/employee" element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="tasks" element={<EmployeeTasks />} />
                <Route path="calendar" element={<div>Calendar</div>} />
                <Route path="clients" element={<div>Client List</div>} />
                <Route path="chat" element={<div>Messages</div>} />
              </Route>
              
              {/* Client routes */}
              <Route path="/client" element={
                <ProtectedRoute allowedRoles={['client']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<div>Client Dashboard</div>} />
                <Route path="tasks" element={<ClientTasks />} />
                <Route path="invoices" element={<div>My Invoices</div>} />
                <Route path="chat" element={<div>Messages</div>} />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
