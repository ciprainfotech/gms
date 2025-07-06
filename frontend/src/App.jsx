import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Layout Component Imports ---
// Ensure these components exist at these paths
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// --- Page Imports (as provided by you) ---
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

// --- CSS and FontAwesome Imports ---
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Your custom styles (use the definitive CSS provided above)
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
library.add(fas);

// --- Main App Component ---
function App() {
  // THIS IS THE STATE THAT CONTROLS THE SIDEBAR ON MOBILE
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // This function is passed to the Header to be called by the menu toggle button
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <BrowserRouter>
      {/* Main layout container. The `.layout` class handles flexbox. */}
      <div className="layout">

        {/* The Sidebar component with a dynamic class for mobile view */}
        <nav className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
          <Sidebar />
        </nav>

        {/* This overlay becomes visible on mobile to close the sidebar */}
        <div
          className={`sidebar-overlay ${isSidebarOpen ? 'is-visible' : ''}`}
          onClick={toggleSidebar}
        ></div>

        {/* Container for Header and Main Content */}
        <div className="content-wrapper">

          {/* Header Component - It receives the toggle function as a prop */}
          <header className="header">
             <Header onMenuToggle={toggleSidebar} />
          </header>

          {/* Main Content Area where pages are rendered */}
          <main className="main-content">
            <Routes>
              {/* --- YOUR ROUTES (UNCHANGED) --- */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/active-jobsheets" element={<ActiveJobSheets />} />
              <Route path="/jobsheet/:jobSheetId" element={<JobSheetDetailPage />} />
              <Route path="/create-invoice" element={<CreateInvoicePage />} />
              <Route path="/task-dashboard" element={<TaskDashboardPage />} />

              <Route path="/job-sheets" element={<JobSheets />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoice/:invoiceId/view" element={<InvoiceViewPage />} />
              <Route path="/accounts" element={<AccountsReceivablePage />} />
              <Route path="/customers-vehicles" element={<CustomersVehiclesPage />} />
              <Route path="/reminders" element={<RemindersPage />} />

              <Route path="/add-customer" element={<AddCustomerPage />} />

              <Route path="/stock" element={<StockManagementPage />} />
              <Route path="/purchase-entry" element={<PurchaseEntryPage />} />
              <Route path="/purchase-history" element={<PurchaseHistoryPage />} />
              <Route path="/analytics-reports" element={<AnalyticsReportsPage />} />
              
              <Route path="/" element={<Navigate replace to="/dashboard" />} />
              
              <Route path="*" element={<div className='text-center mt-5'><h2>404 - Page Not Found</h2><p>The page you requested could not be found.</p></div>} />
            </Routes>
          </main>

        </div> {/* End content-wrapper */}
      </div> {/* End layout */}
    </BrowserRouter>
  );
}

export default App;