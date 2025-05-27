import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Import Pages (adjust paths as needed)
import Dashboard from './pages/Dashboard';
import ActiveJobSheets from './pages/ActiveJobSheets'; // Use the renamed component
import JobSheetDetailPage from './pages/JobSheetDetailPage';
import JobSheets from './pages/JobSheets'; // Historical archive page
import AddCustomerPage from './pages/AddCustomerPage';
import CustomersVehiclesPage from './pages/CustomersVehiclesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceViewPage from './pages/InvoiceViewPage';
import StockManagementPage from './pages/StockManagementPage';
import PurchaseEntryPage from './pages/PurchaseEntryPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import TaskDashboardPage from './pages/TaskDashboardPage'; // Assuming you have this page
import AnalyticsReportsPage from './pages/AnalyticsReportsPage'; // New page

// --- CSS Imports ---
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap base
import './App.css'; // Your custom styles (which includes sidebar, header, main-content styles)

// --- FontAwesome Setup ---
// Make sure you have installed: npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
library.add(fas); // Add all solid icons to the library

// --- Main App Component ---
function App() {
  return (
    <BrowserRouter>
      {/* Main layout container using flexbox */}
      <div className="layout d-flex">

        {/* Sidebar Component */}
        <nav className="sidebar"> {/* Apply sidebar class here */}
          <Sidebar />
        </nav>

        {/* Container for Header and Main Content */}
        <div className="content-wrapper flex-grow-1"> {/* Takes remaining width */}

          {/* Header Component */}
          <header className="header"> {/* Apply header class here */}
             <Header />
          </header>

          {/* Main Content Area where pages are rendered */}
          <main className="main-content"> {/* Apply main-content class here */}
            <Routes>
              {/* Workflow Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/active-jobsheets" element={<ActiveJobSheets />} />
              <Route path="/jobsheet/:jobSheetId" element={<JobSheetDetailPage />} />
              <Route path="/create-invoice" element={<CreateInvoicePage />} />
              <Route path="/task-dashboard" element={<TaskDashboardPage />} />

              {/* Management/Admin Routes */}
              <Route path="/job-sheets" element={<JobSheets />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoice/:invoiceId/view" element={<InvoiceViewPage />} />
              <Route path="/customers-vehicles" element={<CustomersVehiclesPage />} />
              <Route path="/add-customer" element={<AddCustomerPage />} />

               {/* Reports & Tools Routes */}
              <Route path="/stock" element={<StockManagementPage />} />
              <Route path="/purchase-entry" element={<PurchaseEntryPage />} />
              <Route path="/purchase-history" element={<PurchaseHistoryPage />} />
              <Route path="/analytics-reports" element={<AnalyticsReportsPage />} /> {/* New route */}
              {/* <Route path="/revenue" element={<RevenuePage />} /> */}

              {/* Default Route */}
              <Route path="/" element={<Navigate replace to="/dashboard" />} />

              {/* Optional: 404 Not Found */}
              <Route path="*" element={<div className='text-center mt-5'><h2>404 - Page Not Found</h2><p>The page you requested could not be found.</p></div>} />
            </Routes>
          </main>

        </div> {/* End content-wrapper */}
      </div> {/* End layout */}
    </BrowserRouter>
  );
}

export default App;