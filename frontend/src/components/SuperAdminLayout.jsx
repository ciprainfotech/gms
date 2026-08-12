import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { FaShieldAlt, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const SuperAdminLayout = ({ onLogout, user }) => {
  return (
    <div className="d-flex" style={{ height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      {/* Super Admin Dedicated 100vh Sidebar */}
      <SuperAdminSidebar user={user} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflowY: 'auto', minWidth: 0 }}>
        {/* Top Navbar */}
        <header className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center shadow-sm sticky-top" style={{ borderColor: '#e2e8f0', zIndex: 10 }}>
          <div className="d-flex align-items-center">
            <div 
              className="badge me-3 px-3 py-2 fw-bold d-flex align-items-center rounded-pill"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '11px', letterSpacing: '0.5px' }}
            >
              <FaShieldAlt className="me-2 fs-6" /> CIPRA INFOTECH SUPER ADMIN
            </div>
            <h5 className="fw-bold text-dark mb-0 d-none d-md-block" style={{ letterSpacing: '-0.3px', color: '#0f172a' }}>
              Platform Executive Console
            </h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-none d-md-flex align-items-center px-3 py-1 bg-light rounded-pill border" style={{ borderColor: '#e2e8f0' }}>
              <FaUserCircle className="text-secondary me-2 fs-5" />
              <span className="small text-muted">Logged in: <strong className="text-dark">{user?.email || 'admin@ciprainfotech.com'}</strong></span>
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-danger px-3 fw-bold rounded-pill d-flex align-items-center" 
              onClick={onLogout}
            >
              <FaSignOutAlt className="me-1" /> Logout
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
