import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import api from './api/api.js'; // IMPORTED: The API service

// --- Page & Component Imports (Unchanged) ---
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
import AuthPage from './pages/AuthPage';

// --- CSS and FontAwesome Imports (Unchanged) ---
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';  
library.add(fas);

// ==========================================================================
// 1. MAIN APPLICATION LAYOUT COMPONENT (MODIFIED to accept user prop)
// ==========================================================================
const MainLayout = ({ onLogout, user }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`layout-wrapper is-entering`}>
      <nav className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <Sidebar user={user} />
      </nav>
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'is-visible' : ''}`}
        onClick={toggleSidebar}
      ></div>
      <div className="content-wrapper">
        <header className="header">
           <Header onMenuToggle={toggleSidebar} onLogout={onLogout} user={user} />
        </header>
        <main className="main-content">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

// ==========================================================================
// 2. PROTECTED ROUTE COMPONENT (Unchanged)
// ==========================================================================
const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// ==========================================================================
// 3. GLOBAL TRANSITION OVERLAY COMPONENT (Unchanged)
// ==========================================================================
const TransitionOverlay = ({ isVisible }) => {
    return <div className={`transition-overlay ${isVisible ? 'is-visible' : ''}`}></div>;
};

// ==========================================================================
// 4. MAIN APP COMPONENT (MODIFIED with real auth logic)
// ==========================================================================
function App() {
  // MODIFIED: State is no longer derived from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ADDED: To handle initial auth check
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ADDED: useEffect to check auth status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setCurrentUser(data.user);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []); // Empty array ensures this runs only once on mount

  // MODIFIED: handleLogin now accepts user data and sets state
  const handleLogin = (userData) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setCurrentUser(userData);
      // No need to touch localStorage
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 800);
  };

  // MODIFIED: handleLogout now calls the backend API
  const handleLogout = async () => {
    setIsTransitioning(true);
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error("Logout API call failed, but logging out client-side anyway:", error);
    } finally {
      setTimeout(() => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        // ProtectedRoute will handle redirect
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 800);
    }
  };

  // ADDED: Loading state while checking for a session
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner-border text-primary" style={{ width: '4rem', height: '4rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
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
              {/* Pass user data down to the layout */}
              <MainLayout onLogout={handleLogout} user={currentUser} />
            </ProtectedRoute>
          }
        >
          {/* All nested routes remain unchanged */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="active-jobsheets" element={<ActiveJobSheets />} />
          <Route path="jobsheet/:jobSheetId" element={<JobSheetDetailPage />} />
          <Route path="create-invoice" element={<CreateInvoicePage />} />
          <Route path="task-dashboard" element={<TaskDashboardPage />} />
          <Route path="job-sheets" element={<JobSheets />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:invoiceId/view" element={<InvoiceViewPage />} />
          <Route path="accounts" element={<AccountsReceivablePage />} />
          <Route path="customers-vehicles" element={<CustomersVehiclesPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="add-customer" element={<AddCustomerPage />} />
          <Route path="stock" element={<StockManagementPage />} />
          <Route path="purchase-entry" element={<PurchaseEntryPage />} />
          <Route path="purchase-history" element={<PurchaseHistoryPage />} />
          <Route path="analytics-reports" element={<AnalyticsReportsPage />} />
          
          <Route index element={<Navigate replace to="/dashboard" />} />
          
          <Route path="*" element={<div className='text-center mt-5'><h2>404 - Page Not Found</h2><p>The page you requested could not be found within the application.</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;