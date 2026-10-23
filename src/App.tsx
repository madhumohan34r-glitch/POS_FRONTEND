import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Standard Pages
import Index from "./pages/Index";
import CustomerMenu from "./pages/customer/CustomerMenu";
import POS from './pages/POS';
import Kitchen from "./pages/Kitchen";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffLogin from "./pages/StaffLogin";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import StaffPortal from "./pages/StaffPortal";
import Organization from "./pages/organization/Organization";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Tabs
import DashboardTab from "./pages/admin/tabs/DashboardTab";
import OrdersTab from "./pages/admin/tabs/OrdersTab";
import MenuTab from "./pages/admin/tabs/MenuTab";
import StaffTab from "./pages/admin/tabs/StaffTab";
import StaffMgmtTab from "./pages/admin/tabs/StaffMgmtTab";
import FeedbackTab from "./pages/admin/tabs/FeedbackTab";
import PaymentsTab from "./pages/admin/tabs/PaymentsTab";
import TablesTab from "./pages/admin/tabs/TablesTab";
import ReservationsTab from "./pages/admin/tabs/ReservationsTab";
import StockTab from "./pages/admin/tabs/StockTab";
import SettingsTab from "./pages/admin/tabs/SettingsTab";
import { OpsPanel } from './pages/admin/tabs/OpsPanel';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<StaffLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/menu" element={<CustomerMenu />} />
          
          <Route path="/pos" element={
  <ProtectedRoute allowedRoles={['counter']}>
    <POS />
  </ProtectedRoute>
} />
          
   <Route
  path="/kitchen"
  element={
    <ProtectedRoute
      allowedRoles={['kitchen_staff', 'admin']}
    >
      <Kitchen />
    </ProtectedRoute>
  }
/>
          {/* --- UPDATED ADMIN ROUTES --- */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }>

            <Route path="/admin" element={<AdminDashboard />}></Route>
            {/* Default to dashboard if user goes to /admin */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardTab/>} />
            <Route path="orders" element={<OrdersTab />} />
            <Route path="menu" element={<MenuTab />} />
            <Route path="staff" element={<StaffTab />} />
            <Route path="staffmgmt" element={<StaffMgmtTab />} />
            <Route path="feedback" element={<FeedbackTab />} />
            <Route path="payments" element={<PaymentsTab />} />
            <Route path="tables" element={<TablesTab />} />
            <Route path="reservations" element={<ReservationsTab />} />
            <Route path="stock" element={<StockTab />} />
            <Route path="settings" element={<SettingsTab />} />
            <Route path="ops" element={<OpsPanel mode="admin" />} />
          </Route>
          
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff', 'admin', 'cashier', 'kitchen_staff']}>
              <StaffPortal />
            </ProtectedRoute>
          } />
          
          <Route path="/organization" element={
            <ProtectedRoute allowedRoles={['organization']}>
              <Organization />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
