import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GarageProvider, useGarage } from './contexts/GarageContext';
import { ToastProvider } from './contexts/ToastContext';
import { GlobalDateProvider, useGlobalDate } from './contexts/GlobalDateContext';

// UI Loaders
import GarageLoader from './components/ui/GarageLoader';

// Components & Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SuperAdminLayout from './components/SuperAdminLayout';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ActiveJobSheets from './pages/ActiveJobSheets';
import JobSheetDetailPage from './pages/JobSheetDetailPage';
import JobSheets from './pages/JobSheets';
import AddCustomerPage from './pages/AddCustomerPage';
import CustomersVehiclesPage from './pages/CustomersVehiclesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceViewPage from './pages/InvoiceViewPage';
import StockManagementPage from './pages/StockManagementPage';
import PurchaseEntryPage from './pages/PurchaseEntryPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import TaskDashboardPage from './pages/TaskDashboardPage';
import AnalyticsReportsPage from './pages/AnalyticsReportsPage';
import AccountsReceivablePage from './pages/AccountsReceivablePage';
import RemindersPage from './pages/RemindersPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PayrollPage from './pages/PayrollPage';
import NotFoundPage from './pages/NotFoundPage';

// ==========================================================================
// 1. MAIN LAYOUT
// ==========================================================================
const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { garage, isSuspended, refreshGarage } = useGarage();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  if (isSuspended && !user?.is_super_admin) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center px-3" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#F8FAFC' }}>
        <div className="card border-0 shadow-lg p-4 p-md-5 rounded-4 text-center" style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', maxWidth: '520px', width: '100%' }}>
          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            <span style={{ fontSize: '36px' }}>🔒</span>
          </div>
          <h3 className="fw-bold mb-2 text-white">Workspace License Suspended</h3>
          <p className="mb-4" style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6' }}>
            The subscription license for <strong className="text-white">{garage?.name || 'your garage'}</strong> has been suspended by Cipra Infotech Super Admin. Workspace access is temporarily locked.
          </p>
          <div className="p-3 rounded-3 mb-4 text-start" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <small className="text-uppercase fw-bold d-block mb-1" style={{ color: '#6366F1', fontSize: '10px', letterSpacing: '0.8px' }}>Reactivation & Billing Support</small>
            <div className="fw-bold text-white small">Cipra Infotech Administration</div>
            <div className="text-muted small">Email: admin@ciprainfotech.com</div>
          </div>
          <button 
            className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold w-100"
            onClick={logout}
          >
            Logout of Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <nav className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <Sidebar user={user} garage={garage} onClose={() => setSidebarOpen(false)} />
      </nav>
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'is-visible' : ''}`}
        onClick={toggleSidebar}
      />
      <div className="content-wrapper">
        <header className="header">
          <Header onMenuToggle={toggleSidebar} onLogout={logout} user={user} garage={garage} />
        </header>
        <main className="main-content">
          <Outlet context={{ onGarageUpdate: refreshGarage, activeGarage: garage }} />
        </main>
      </div>
    </div>
  );
};

// ==========================================================================
// 2. ROUTE GUARDS
// ==========================================================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <GarageLoader title="Authenticating..." subtext="Verifying security credentials..." />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <GarageLoader title="Verifying Access..." subtext="Checking admin permissions..." />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!user?.is_super_admin) return <Navigate to="/dashboard" replace />;
  return children;
};

const FeatureRouteGuard = ({ isEnabled, featureName, children }) => {
  if (isEnabled === false) {
    return <Navigate to="/dashboard" state={{ featureDenied: featureName }} replace />;
  }
  return children;
};

const ReadonlyAccountGuard = ({ children }) => {
  const { isSuspended } = useGarage();
  if (isSuspended) {
    return <Navigate to="/dashboard" state={{ accountSuspended: true }} replace />;
  }
  return children;
};

const ProfileCompletionGuard = ({ children }) => {
  const { garage } = useGarage();
  const location = useLocation();
  const isProfileIncomplete = garage && (!garage.phone || !garage.address);
  if (isProfileIncomplete && location.pathname !== '/settings') {
    return <Navigate to="/settings" state={{ requireProfileSetup: true }} replace />;
  }
  return children;
};

// ==========================================================================
// 3. APP CONTENT & ROUTES
// ==========================================================================
function AppContent() {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();
  const { garage, features } = useGarage();
  const { setWorkingDate, today } = useGlobalDate();

  if (isLoading) {
    return <GarageLoader title="Garage Workshop" subtext="Loading your workspace..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Auth Route --- */}
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              user?.is_super_admin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage onLoginSuccess={(data) => {
                localStorage.removeItem('masterWorkingDate');
                setWorkingDate(today);
                login(data.user, data.activeGarage);
              }} />
            )
          }
        />

        {/* --- Protected Application Routes --- */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ProfileCompletionGuard>
                <MainLayout />
              </ProfileCompletionGuard>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="active-jobsheets" element={<ActiveJobSheets />} />
          <Route path="jobsheet/:jobSheetId" element={<JobSheetDetailPage />} />
          <Route path="create-invoice" element={<ReadonlyAccountGuard><CreateInvoicePage /></ReadonlyAccountGuard>} />
          <Route path="task-dashboard" element={<FeatureRouteGuard isEnabled={features.tasks} featureName="Internal Tasks"><TaskDashboardPage /></FeatureRouteGuard>} />
          <Route path="job-sheets" element={<JobSheets />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:invoiceId/view" element={<InvoiceViewPage />} />
          <Route path="accounts" element={<AccountsReceivablePage />} />
          <Route path="customers-vehicles" element={<CustomersVehiclesPage />} />
          <Route path="reminders" element={<FeatureRouteGuard isEnabled={features.reminders} featureName="Reminders"><RemindersPage /></FeatureRouteGuard>} />
          <Route path="add-customer" element={<ReadonlyAccountGuard><AddCustomerPage /></ReadonlyAccountGuard>} />
          <Route path="stock" element={<FeatureRouteGuard isEnabled={features.stock} featureName="Manage Stock"><StockManagementPage /></FeatureRouteGuard>} />
          <Route path="purchase-entry" element={<FeatureRouteGuard isEnabled={features.purchase} featureName="Record Purchase"><PurchaseEntryPage /></FeatureRouteGuard>} />
          <Route path="purchase-history" element={<FeatureRouteGuard isEnabled={features.purchase} featureName="Purchase History"><PurchaseHistoryPage /></FeatureRouteGuard>} />
          <Route path="analytics-reports" element={<FeatureRouteGuard isEnabled={features.analytics} featureName="Analytics & Reports"><AnalyticsReportsPage /></FeatureRouteGuard>} />
          <Route path="payroll" element={<FeatureRouteGuard isEnabled={features.payroll} featureName="Staff & Payroll"><PayrollPage /></FeatureRouteGuard>} />
          <Route path="edit-vehicle/:id" element={<AddCustomerPage />} />
          <Route path="settings" element={<ProfileSettingsPage />} />

          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* --- Super Admin Portal Routes --- */}
        <Route
          path="/admin/*"
          element={
            <SuperAdminRoute>
              <SuperAdminLayout onLogout={logout} user={user} />
            </SuperAdminRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="garages" element={<SuperAdminDashboard />} />
          <Route path="onboard" element={<SuperAdminDashboard />} />
          <Route path="whatsapp" element={<SuperAdminDashboard />} />
          <Route path="plans" element={<SuperAdminDashboard />} />
          <Route path="security" element={<SuperAdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GarageProvider>
          <ToastProvider>
            <GlobalDateProvider>
              <AppContent />
            </GlobalDateProvider>
          </ToastProvider>
        </GarageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;