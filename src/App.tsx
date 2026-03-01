import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientsChart from "./pages/PatientsChart";
import PatientsBill from "./pages/PatientsBill";
import Receipts from "./pages/Receipts";
import Clinical from "./pages/Clinical";
import Laboratory from "./pages/Laboratory";
import Pharmacy from "./pages/Pharmacy";
import Reports from "./pages/Reports";
import LabTests from "./pages/setup/LabTests";
import MindrayIntegration from "./pages/MindrayIntegration";
import Clinics from '@/pages/setup/Clinics';
import Security from "./pages/setup/Security";
import SecurityClean from "./pages/setup/SecurityClean";
import SecurityFixed from "./pages/setup/SecurityFixed";
import SecurityMinimal from "./pages/setup/SecurityMinimal";
import SecurityWorking from "./pages/setup/SecurityWorking";
import SecuritySimple from "./pages/setup/SecuritySimple";
import SecurityTest from "./pages/setup/SecurityTest";
import LedgerAccounts from "./pages/accounts/LedgerAccounts";
import Profile from "./pages/Profile";
import SetupPassword from "./pages/SetupPassword";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect reception users to patients page if they try to access unauthorized routes
    if (user.role === 'reception') {
      return <Navigate to="/patients" replace />;
    }
    // Redirect other unauthorized users to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user) {
    // Redirect reception users to patients page, others to dashboard
    const redirectPath = user.role === 'reception' ? '/patients' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  console.log('[AppRoutes] Component rendered, user logged in:', !!user, 'role:', user?.role);
  
  // Dynamic root redirect based on user role
  const getRootRedirect = () => {
    if (!user) return "/login";
    return user.role === 'reception' ? '/patients' : '/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'reception', 'doctor', 'lab', 'pharmacy', 'reports']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/accounts/ledger" element={
        (() => {
          console.log('[Route /accounts/ledger] Route matched! Rendering LedgerAccounts');
          return (
            <ProtectedRoute allowedRoles={['admin', 'reception']}>
              <LedgerAccounts />
            </ProtectedRoute>
          );
        })()
      } />
      <Route path="/patients" element={
        <ProtectedRoute allowedRoles={['admin', 'reception', 'doctor']}>
          <Patients />
        </ProtectedRoute>
      } />
      <Route path="/patients-chart" element={
        <ProtectedRoute allowedRoles={['admin', 'reception', 'doctor']}>
          <PatientsChart />
        </ProtectedRoute>
      } />
      <Route path="/patients-bill" element={
        <ProtectedRoute allowedRoles={['admin', 'reception', 'doctor']}>
          <PatientsBill />
        </ProtectedRoute>
      } />
      <Route path="/receipts" element={
        <ProtectedRoute allowedRoles={['admin', 'reception', 'doctor', 'pharmacy']}>
          <Receipts />
        </ProtectedRoute>
      } />
      <Route path="/clinical" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor']}>
          <Clinical />
        </ProtectedRoute>
      } />
      <Route path="/laboratory" element={
        <ProtectedRoute allowedRoles={['admin', 'lab', 'doctor']}>
          <Laboratory />
        </ProtectedRoute>
      } />
      <Route path="/pharmacy" element={
        <ProtectedRoute allowedRoles={['admin', 'pharmacy']}>
          <Pharmacy />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['admin', 'reports']}>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/setup/lab-tests" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <LabTests />
        </ProtectedRoute>
      } />
      <Route path="/setup/mindray-integration" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <MindrayIntegration />
        </ProtectedRoute>
      } />
      <Route path="/setup/clinics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Clinics />
        </ProtectedRoute>
      } />
      <Route path="/setup/security" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <SecurityFixed />
        </ProtectedRoute>
      } />
      <Route path="/setup/security-test" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <SecurityTest />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
// Force rebuild Fri Feb  6 11:28:13 AM EET 2026
