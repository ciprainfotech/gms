import React from "react";
import { NavLink } from "react-router-dom";
import { 
  FaTachometerAlt, FaBuilding, FaUserPlus, FaWhatsapp, 
  FaReceipt, FaShieldAlt, FaSignOutAlt, FaLock
} from "react-icons/fa";

const SuperAdminSidebar = ({ user, onLogout }) => {
    const navLinkClass = ({ isActive }) => (
      isActive 
        ? "nav-link active fw-bold text-white shadow-sm d-flex align-items-center py-2.5 px-3 rounded-3" 
        : "nav-link text-slate-400 d-flex align-items-center py-2.5 px-3 rounded-3"
    );

    const activeStyle = ({ isActive }) => ({
      background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
      color: isActive ? '#ffffff' : '#94a3b8',
      transition: 'all 0.2s ease-in-out'
    });

    return (
        <div 
          className="d-flex flex-column shadow-lg" 
          style={{ width: '260px', minWidth: '260px', height: '100vh', backgroundColor: '#0f172a', borderRight: '1px solid #1e293b' }}
        >
            {/* Super Admin Header / Platform Branding */}
            <div className="sidebar-header p-4 border-bottom" style={{ borderColor: '#1e293b', backgroundColor: '#090d16' }}>
                <div className="d-flex align-items-center">
                    <div 
                      className="p-2.5 rounded-3 me-3 text-white shadow-sm d-flex align-items-center justify-content-center" 
                      style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', width: '40px', height: '40px' }}
                    >
                        <FaShieldAlt size={20} />
                    </div>
                    <div>
                        <h6 className="fw-bold text-white mb-0" style={{ fontSize: '15px', letterSpacing: '0.3px' }}>
                            Cipra Infotech
                        </h6>
                        <small className="fw-bold text-uppercase" style={{ color: '#ef4444', fontSize: '9px', letterSpacing: '1px' }}>
                            SUPER ADMIN CONSOLE
                        </small>
                    </div>
                </div>
            </div>

            {/* Platform Navigation */}
            <div className="sidebar-content flex-grow-1 p-3 overflow-y-auto">
                <ul className="nav flex-column gap-1">
                    <h6 className="text-uppercase px-2 mb-2 fw-bold" style={{ color: '#64748b', fontSize: '10px', letterSpacing: '1px' }}>
                        Platform Management
                    </h6>

                    <li className="nav-item">
                        <NavLink to="/admin" end className={navLinkClass} style={activeStyle}>
                            <FaTachometerAlt className="me-3 fs-6" /> Overview & Metrics
                        </NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/admin/garages" className={navLinkClass} style={activeStyle}>
                            <FaBuilding className="me-3 fs-6" /> Clients & Garages
                        </NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/admin/onboard" className={navLinkClass} style={activeStyle}>
                            <FaUserPlus className="me-3 fs-6" /> Onboard New Client
                        </NavLink>
                    </li>

                    <h6 className="text-uppercase px-2 mt-4 mb-2 fw-bold" style={{ color: '#64748b', fontSize: '10px', letterSpacing: '1px' }}>
                        Gateway & Billing
                    </h6>

                    <li className="nav-item">
                        <NavLink to="/admin/whatsapp" className={navLinkClass} style={activeStyle}>
                            <FaWhatsapp className="me-3 fs-6" /> WhatsApp Gateway
                        </NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/admin/plans" className={navLinkClass} style={activeStyle}>
                            <FaReceipt className="me-3 fs-6" /> SaaS Pricing & Tiers
                        </NavLink>
                    </li>

                    <h6 className="text-uppercase px-2 mt-4 mb-2 fw-bold" style={{ color: '#64748b', fontSize: '10px', letterSpacing: '1px' }}>
                        Self Controls
                    </h6>

                    <li className="nav-item">
                        <NavLink to="/admin/security" className={navLinkClass} style={activeStyle}>
                            <FaLock className="me-3 fs-6" /> Admin Security & Account
                        </NavLink>
                    </li>
                </ul>
            </div>

            {/* Platform Footer */}
            <div className="sidebar-footer p-3 border-top mt-auto" style={{ borderColor: '#1e293b', backgroundColor: '#090d16' }}>
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <div className="fw-bold text-white small">{user?.name || 'Cipra Platform Admin'}</div>
                        <small style={{ color: '#64748b', fontSize: '10px' }}>{user?.email || 'admin@ciprainfotech.com'}</small>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-danger border-0 p-2" 
                      onClick={onLogout}
                      title="Log Out of Platform"
                    >
                        <FaSignOutAlt size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminSidebar;
