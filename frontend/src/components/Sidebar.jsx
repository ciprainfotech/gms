import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaWrench,
  FaFileInvoiceDollar,
  FaFolderOpen,
  FaReceipt,
  FaUsers,
  FaBoxOpen,
  FaChartPie,
  FaPaperPlane,
  FaShieldAlt,
  FaHistory,
  FaIdCard
} from 'react-icons/fa';
import { useGarage } from '../contexts/GarageContext';
import { useAuth } from '../contexts/AuthContext';

import { SERVER_BASE_URL } from '../api/api.js';

const API_BASE_URL = SERVER_BASE_URL;

const Sidebar = ({ onClose }) => {
  const { garage, features, isSuspended } = useGarage();
  const { user } = useAuth();

  const navLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  const garageName = garage?.name || (user?.name ? `${user.name}'s Garage` : 'Garage Workshop');
  const logoUrl = garage?.logo_url;
  const hasLogo = Boolean(logoUrl);
  const logoSrc = hasLogo
    ? (logoUrl.startsWith('http') ? logoUrl : `${API_BASE_URL}${logoUrl}`)
    : null;

  const initials = garageName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* Sidebar Header — Brand Dock */}
      <div className="sidebar-header d-flex flex-column px-3 py-3 align-items-center justify-content-center">
        <NavLink to="/dashboard" className="d-flex align-items-center justify-content-center text-decoration-none w-100" onClick={handleLinkClick}>
          {hasLogo ? (
            <img
              src={logoSrc}
              alt="Garage Logo"
              style={{ maxHeight: '52px', maxWidth: '190px', objectFit: 'contain' }}
              className="rounded py-1"
            />
          ) : (
            <div className="d-flex align-items-center gap-2 w-100">
              <div
                className="rounded-2 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                  fontSize: '15px',
                  letterSpacing: '1px'
                }}
                title={garageName}
              >
                {initials}
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-truncate" style={{ fontSize: '0.85rem', color: '#FFFFFF', lineHeight: 1.2 }}>
                  {garageName}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#A5B4FC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Garage Workshop
                </div>
              </div>
            </div>
          )}
        </NavLink>
        {isSuspended && (
          <span className="badge bg-danger text-uppercase mt-2 w-100 py-1 text-center" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>
            🔒 Read-Only (Suspended)
          </span>
        )}
      </div>

      {/* Sidebar Navigation Items */}
      <div className="sidebar-content flex-grow-1">
        <ul className="nav flex-column">
          <h6 className="sidebar-heading">Workflow</h6>
          <li className="nav-item">
            <NavLink to="/dashboard" className={navLinkClass} onClick={handleLinkClick}>
              <FaTachometerAlt /> Dashboard
            </NavLink>
          </li>
          {features.tasks && (
            <li className="nav-item">
              <NavLink to="/active-jobsheets" className={navLinkClass} onClick={handleLinkClick}>
                <FaWrench /> Active Job Sheets
              </NavLink>
            </li>
          )}
          {!isSuspended && (
            <li className="nav-item">
              <NavLink to="/create-invoice" className={navLinkClass} onClick={handleLinkClick}>
                <FaFileInvoiceDollar /> Create Invoice
              </NavLink>
            </li>
          )}

          <h6 className="sidebar-heading">Management</h6>
          {features.tasks && (
            <li className="nav-item">
              <NavLink to="/job-sheets" className={navLinkClass} onClick={handleLinkClick}>
                <FaFolderOpen /> Job Sheets Archive
              </NavLink>
            </li>
          )}
          <li className="nav-item">
            <NavLink to="/invoices" className={navLinkClass} onClick={handleLinkClick}>
              <FaReceipt /> Invoices
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/accounts" className={navLinkClass} onClick={handleLinkClick}>
              <FaFileInvoiceDollar /> Accounts
            </NavLink>
          </li>
          {features.reminders && (
            <li className="nav-item">
              <NavLink to="/reminders" className={navLinkClass} onClick={handleLinkClick}>
                <FaPaperPlane /> Reminders
              </NavLink>
            </li>
          )}
          <li className="nav-item">
            <NavLink to="/customers-vehicles" className={navLinkClass} onClick={handleLinkClick}>
              <FaUsers /> Customers & Vehicles
            </NavLink>
          </li>
          {features.payroll && (
            <li className="nav-item">
              <NavLink to="/payroll" className={navLinkClass} onClick={handleLinkClick}>
                <FaIdCard /> Staff & Payroll
              </NavLink>
            </li>
          )}

          {(features.stock || features.purchase || features.analytics) && (
            <>
              <h6 className="sidebar-heading">Reports & Tools</h6>
              {features.stock && (
                <li className="nav-item">
                  <NavLink to="/stock" className={navLinkClass} onClick={handleLinkClick}>
                    <FaBoxOpen /> Stock & Inventory
                  </NavLink>
                </li>
              )}
              {features.purchase && (
                <>
                  <li className="nav-item">
                    <NavLink to="/purchase-entry" className={navLinkClass} onClick={handleLinkClick}>
                      <FaBoxOpen /> Record Purchase
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/purchase-history" className={navLinkClass} onClick={handleLinkClick}>
                      <FaHistory /> Purchase History
                    </NavLink>
                  </li>
                </>
              )}
              {features.analytics && (
                <li className="nav-item">
                  <NavLink to="/analytics-reports" className={navLinkClass} onClick={handleLinkClick}>
                    <FaChartPie /> Analytics & Reports
                  </NavLink>
                </li>
              )}
            </>
          )}

          <h6 className="sidebar-heading">Settings</h6>
          <li className="nav-item">
            <NavLink to="/settings" className={navLinkClass} onClick={handleLinkClick}>
              <FaWrench /> Profile & Branding
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer mt-auto pt-3 pb-3 px-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
          <p className="mb-1 text-nowrap" style={{ color: 'rgba(226, 232, 240, 0.6)' }}>
            &copy; {new Date().getFullYear()} <strong style={{ color: '#FFFFFF' }}>Cipra Infotech</strong>
          </p>
          <p className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: '9px', gap: '4px', letterSpacing: '0.5px', color: '#A5B4FC', textTransform: 'uppercase' }}>
            <FaShieldAlt /> Secure Workspace
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;