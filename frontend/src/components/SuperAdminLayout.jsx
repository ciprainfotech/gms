import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { FaShieldAlt, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const SuperAdminLayout = ({ onLogout, user }) => {
  return (
    <div className="d-flex" style={{ height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: "'Inter', sans-serif" }}>
      {/* Super Admin Dedicated 100vh Sidebar */}
      <SuperAdminSidebar user={user} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflowY: 'auto', minWidth: 0, backgroundColor: '#F8FAFC' }}>
        {/* Top Navbar */}
        <header className="px-4 py-3 d-flex justify-content-between align-items-center sticky-top shadow-sm" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', zIndex: 10 }}>
          <div className="d-flex align-items-center">
            <div 
              className="badge me-3 px-3 py-2 fw-bold d-flex align-items-center rounded-pill"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: '11px', letterSpacing: '0.8px' }}
            >
              <FaShieldAlt className="me-2 fs-6" /> CIPRA INFOTECH SUPER ADMIN
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
              <FaSignOutAlt className="me-1.5" /> Logout
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
