import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext.mysql.pure"; // Use MySQL auth provider
import { DatabaseProvider } from "@/contexts/DatabaseContext.browser"; // Import browser-safe database provider
import { UserRole } from "@/types";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientsChart from "./pages/PatientsChart";
import Clinical from "./pages/Clinical";
import PatientsBill from "./pages/PatientsBill";
import Receipts from "./pages/Receipts";
import Laboratory from "./pages/Laboratory";
import Pharmacy from "./pages/Pharmacy";
import Reports from "./pages/Reports";
import LabTests from "./pages/setup/LabTests";
import Services from "./pages/setup/Services.mysql";
import Clinics from "./pages/setup/Clinics";
import MindrayIntegration from "./pages/MindrayIntegration";
import Security from "./pages/setup/Security";
import LedgerAccounts from "./pages/accounts/LedgerAccounts";
import CashTransfer from "./pages/accounts/CashTransfer";
import CashierShift from "./pages/cashier/CashierShift";
import Suppliers from "./pages/procurement/Suppliers";
import PurchaseOrders from "./pages/procurement/PurchaseOrders";
import DailyExpenses from "./pages/procurement/DailyExpenses";
import Profile from "./pages/Profile";
import SetupPassword from "./pages/SetupPassword.mysql";
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
      <Route path="/setup-password" element={<SetupPassword />} />
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'reception', 'doctor', 'lab', 'pharmacy', 'reports']}>
          <Dashboard />
        </ProtectedRoute>
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
      <Route path="/clinical" element={
        <ProtectedRoute allowedRoles={['admin', 'doctor']}>
          <Clinical />
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
      <Route path="/pharmacy/inventory" element={
        <ProtectedRoute allowedRoles={['admin', 'pharmacy']}>
          <Pharmacy inventoryOnly={true} />
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
      <Route path="/setup/services" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Services />
        </ProtectedRoute>
      } />
      <Route path="/setup/clinics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Clinics />
        </ProtectedRoute>
      } />
      <Route path="/setup/mindray-integration" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <MindrayIntegration />
        </ProtectedRoute>
      } />
      <Route path="/setup/security" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Security />
        </ProtectedRoute>
      } />
      <Route path="/accounts/ledger" element={
        <ProtectedRoute allowedRoles={['admin', 'reception']}>
          <LedgerAccounts />
        </ProtectedRoute>
      } />
      <Route path="/accounts/cash-transfer" element={
        <ProtectedRoute allowedRoles={['admin', 'reception', 'pharmacy', 'cashier']}>
          <CashTransfer />
        </ProtectedRoute>
      } />
      <Route path="/cashier/shift" element={
        <ProtectedRoute allowedRoles={['admin', 'reception', 'pharmacy', 'cashier']}>
          <CashierShift />
        </ProtectedRoute>
      } />
      <Route path="/procurement/suppliers" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Suppliers />
        </ProtectedRoute>
      } />
      <Route path="/procurement/purchase-orders" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <PurchaseOrders />
        </ProtectedRoute>
      } />
      <Route path="/procurement/daily-expenses" element={
        <ProtectedRoute allowedRoles={['admin', 'cashier']}>
          <DailyExpenses />
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

const AppContent = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Wrap entire app with DatabaseProvider to make repositories available everywhere */}
    <DatabaseProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DatabaseProvider>
  </QueryClientProvider>
);

export default App;
