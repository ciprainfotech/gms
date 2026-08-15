import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { FaShieldAlt, FaSignOutAlt, FaUserCircle, FaBars } from 'react-icons/fa';

const SuperAdminLayout = ({ onLogout, user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="d-flex" style={{ height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none" 
          style={{ zIndex: 1040 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <style>{`
        .super-admin-sidebar {
          width: 260px;
          z-index: 1050;
          transition: transform 0.3s ease-in-out;
          background-color: #FFFFFF;
        }
        @media (min-width: 768px) {
          .super-admin-sidebar {
            transform: none !important;
            position: static !important;
          }
        }
        @media (max-width: 767.98px) {
          .super-admin-sidebar {
            position: fixed !important;
            transform: ${isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'};
          }
        }
      `}</style>

      {/* Super Admin Dedicated 100vh Sidebar */}
      <div className="super-admin-sidebar h-100 shadow-sm d-md-block top-0 start-0">
        <SuperAdminSidebar user={user} onLogout={onLogout} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflowY: 'auto', minWidth: 0, backgroundColor: '#F8FAFC' }}>
        {/* Top Navbar */}
        <header className="px-4 py-3 d-flex justify-content-between align-items-center sticky-top shadow-sm" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', zIndex: 10 }}>
          <div className="d-flex align-items-center">
            <button 
              className="btn d-md-none border-0 p-0 me-3" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <FaBars className="fs-4 text-dark" />
            </button>
            <div 
              className="badge me-3 px-3 py-2 fw-bold d-none d-sm-flex align-items-center rounded-pill"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: '11px', letterSpacing: '0.8px' }}
            >
              <FaShieldAlt className="me-2 fs-6" /> SUPER ADMIN
            </div>
            <h5 className="fw-bold text-dark mb-0 d-none d-md-block" style={{ letterSpacing: '-0.3px', color: '#0F172A' }}>
              Platform Executive Console
            </h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-none d-md-flex align-items-center px-3 py-1.5 rounded-pill" style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <FaUserCircle className="text-primary me-2 fs-5" />
              <span className="small text-muted">Logged in: <strong className="text-dark">{user?.email || 'admin@ciprainfotech.com'}</strong></span>
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-danger px-3.5 fw-bold rounded-pill d-flex align-items-center shadow-sm" 
              onClick={onLogout}
            >
              <FaSignOutAlt className="me-1.5" /> <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
