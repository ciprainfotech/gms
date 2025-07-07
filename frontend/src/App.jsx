import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// --- Page & Component Imports ---
// (Ensure these paths match your project structure)
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
import AuthPage from './pages/AuthPage'; // Your full-screen auth page

// --- CSS and FontAwesome Imports ---
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Your main application stylesheet
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
library.add(fas);

// ==========================================================================
// 1. MAIN APPLICATION LAYOUT COMPONENT
// This component wraps all authenticated pages.
// ==========================================================================
const MainLayout = ({ onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    // Added class for entry animation
    <div className={`layout-wrapper is-entering`}>
      <nav className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <Sidebar />
      </nav>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'is-visible' : ''}`}
        onClick={toggleSidebar}
      ></div>
      
      <div className="content-wrapper">
        <header className="header">
           <Header onMenuToggle={toggleSidebar} onLogout={onLogout} />
        </header>

        <main className="main-content">
          {/* Outlet is the placeholder where nested routes will be rendered */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

// ==========================================================================
// 2. PROTECTED ROUTE COMPONENT
// This checks for authentication before rendering a component.
// ==========================================================================
const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// ==========================================================================
// 3. GLOBAL TRANSITION OVERLAY COMPONENT
// This component manages the fade-in/fade-out effect between pages.
// ==========================================================================
const TransitionOverlay = ({ isVisible }) => {
    return <div className={`transition-overlay ${isVisible ? 'is-visible' : ''}`}></div>;
};


// ==========================================================================
// 4. MAIN APP COMPONENT
// This is the top-level component that manages state and routing logic.
// ==========================================================================
function App() {
  // Use localStorage to check for an existing session and persist login
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLogin = () => {
    // 1. Start the transition: fade IN the overlay
    setIsTransitioning(true);

    // 2. Wait for the overlay to fully cover the screen
    setTimeout(() => {
      // 3. Update the authentication state (this swaps AuthPage with MainLayout)
      localStorage.setItem('isLoggedIn', 'true');
      setIsAuthenticated(true);

      // 4. Wait a moment for the new layout to render, then fade OUT the overlay
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 800); // This duration must match the CSS transition duration for the overlay
  };

  const handleLogout = () => {
    // Use the same transition effect for logging out
    setIsTransitioning(true);
    setTimeout(() => {
      localStorage.removeItem('isLoggedIn');
      setIsAuthenticated(false);
      // The ProtectedRoute will automatically redirect to /auth
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 800);
  };

  return (
    <BrowserRouter>
      {/* The Transition Overlay lives outside the Routes to cover everything */}
      <TransitionOverlay isVisible={isTransitioning} />

      <Routes>
        {/* --- Unprotected Authentication Route --- */}
        <Route 
          path="/auth" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace /> 
            ) : (
              <AuthPage onLoginSuccess={handleLogin} />
            )
          } 
        />

        {/* --- Protected Application Routes --- */}
        <Route 
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MainLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          {/* These are the nested routes that will render inside MainLayout's <Outlet> */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="active-jobsheets" element={<ActiveJobSheets />} />
          <Route path="jobsheet/:jobSheetId" element={<JobSheetDetailPage />} />
          <Route path="create-invoice" element={<CreateInvoicePage />} />
          <Route path="task-dashboard" element={<TaskDashboardPage />} />
          <Route path="job-sheets" element={<JobSheets />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoice/:invoiceId/view" element={<InvoiceViewPage />} />
          <Route path="accounts" element={<AccountsReceivablePage />} />
          <Route path="customers-vehicles" element={<CustomersVehiclesPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="add-customer" element={<AddCustomerPage />} />
          <Route path="stock" element={<StockManagementPage />} />
          <Route path="purchase-entry" element={<PurchaseEntryPage />} />
          <Route path="purchase-history" element={<PurchaseHistoryPage />} />
          <Route path="analytics-reports" element={<AnalyticsReportsPage />} />
          
          {/* Default route for the protected area redirects to the dashboard */}
          <Route index element={<Navigate replace to="/dashboard" />} />
          
          {/* Catch-all for any other route inside the protected area */}
          <Route path="*" element={<div className='text-center mt-5'><h2>404 - Page Not Found</h2><p>The page you requested could not be found within the application.</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;