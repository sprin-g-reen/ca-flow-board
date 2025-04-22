
import { Provider } from 'react-redux';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from './store';
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DashboardLayout from './components/layout/DashboardLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeTasks from './pages/employee/EmployeeTasks';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerTasks from './pages/owner/OwnerTasks';
import AdminTasks from './pages/admin/AdminTasks';
import ClientTasks from './pages/client/ClientTasks';

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Owner routes */}
            <Route path="/owner" element={<DashboardLayout />}>
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="tasks" element={<OwnerTasks />} />
              <Route path="clients" element={<div>Clients Management</div>} />
              <Route path="employees" element={<div>Employee Management</div>} />
              <Route path="invoices" element={<div>Invoices Management</div>} />
              <Route path="calendar" element={<div>Calendar</div>} />
              <Route path="analytics" element={<div>Analytics</div>} />
              <Route path="settings" element={<div>Settings</div>} />
            </Route>
            
            {/* Super Admin routes */}
            <Route path="/admin" element={<DashboardLayout />}>
              <Route path="dashboard" element={<div>Admin Dashboard</div>} />
              <Route path="tasks" element={<AdminTasks />} />
              <Route path="templates" element={<div>Task Templates</div>} />
              <Route path="employees" element={<div>Employee Management</div>} />
              <Route path="invoices" element={<div>Invoices Management</div>} />
              <Route path="analytics" element={<div>Analytics</div>} />
            </Route>
            
            {/* Employee routes */}
            <Route path="/employee" element={<DashboardLayout />}>
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="tasks" element={<EmployeeTasks />} />
              <Route path="calendar" element={<div>Calendar</div>} />
              <Route path="clients" element={<div>Client List</div>} />
              <Route path="chat" element={<div>Messages</div>} />
            </Route>
            
            {/* Client routes */}
            <Route path="/client" element={<DashboardLayout />}>
              <Route path="dashboard" element={<div>Client Dashboard</div>} />
              <Route path="tasks" element={<ClientTasks />} />
              <Route path="invoices" element={<div>My Invoices</div>} />
              <Route path="chat" element={<div>Messages</div>} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
