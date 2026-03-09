import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ContactsPage from "@/pages/crm/ContactsPage";
import LeadsPage from "@/pages/crm/LeadsPage";
import MeetingsPage from "@/pages/crm/MeetingsPage";
import DealsPage from "@/pages/crm/DealsPage";
import ContractsPage from "@/pages/crm/ContractsPage";
import MailPage from "@/pages/MailPage";
import InventoryPage from "@/pages/InventoryPage";
import DocumentsPage from "@/pages/DocumentsPage";
import TasksPage from "@/pages/TasksPage";
import ProjectsPage from "@/pages/ProjectsPage";
import BudgetsPage from "@/pages/BudgetsPage";
import CommissionsPage from "@/pages/CommissionsPage";
import WorkflowsPage from "@/pages/WorkflowsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Зареждане...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/crm/contacts" element={<ContactsPage />} />
        <Route path="/crm/leads" element={<LeadsPage />} />
        <Route path="/crm/meetings" element={<MeetingsPage />} />
        <Route path="/crm/deals" element={<DealsPage />} />
        <Route path="/crm/contracts" element={<ContractsPage />} />
        <Route path="/mail" element={<MailPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/commissions" element={<CommissionsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
