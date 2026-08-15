import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaBell, FaBars, FaUserCircle, FaCog, FaSignOutAlt, FaWhatsapp, FaShieldAlt, FaArrowRight } from "react-icons/fa";
import logoIcon from "../assets/logo-icon.svg";
import api from "../api/api.js";

const Header = ({ onMenuToggle, onLogout, user, garage }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [waBalance, setWaBalance] = useState(null);
    const [waAgentStatus, setWaAgentStatus] = useState(null);
    const [query, setQuery] = useState('');
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const pageMeta = {
        '/dashboard': ['Workshop flow', 'Track every vehicle from arrival to delivery.'],
        '/active-jobsheets': ['Active work', 'Keep repairs moving without losing details.'],
        '/job-sheets': ['Job sheet archive', 'Find, review, and follow up on completed work.'],
        '/create-invoice': ['Create invoice', 'Turn completed work into a clear customer invoice.'],
        '/invoices': ['Invoices', 'View billing and payment progress.'],
        '/accounts': ['Accounts receivable', 'Stay ahead of outstanding customer balances.'],
        '/customers-vehicles': ['Customer directory', 'Every customer and vehicle, in one place.'],
        '/add-customer': ['New customer', 'Build a complete customer and vehicle profile.'],
        '/stock': ['Stock & inventory', 'Know what parts are available.'],
        '/purchase-entry': ['Record purchase', 'Add supplier purchases into inventory.'],
        '/purchase-history': ['Purchase history', 'Review supplier and inventory logs.'],
        '/analytics-reports': ['Analytics & reports', 'Workshop business performance.'],
        '/reminders': ['Service reminders', 'Send personal customer service follow-ups.'],
        '/settings': ['Workspace settings', 'Manage garage branding and preferences.'],
    };
    const [pageTitle, pageDescription] = pageMeta[location.pathname] || (location.pathname.startsWith('/jobsheet/') ? ['Job sheet', 'Review vehicle and repair details.'] : ['Garage workspace', 'Workshop management.']);

    useEffect(() => {
        const fetchWaData = async () => {
            try {
                const [balRes, statusRes] = await Promise.all([
                    api.get('/whatsapp/balance'),
                    api.get('/whatsapp/status')
                ]);
                if (balRes.ok) {
                    const data = await balRes.json();
                    setWaBalance(data);
                }
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setWaAgentStatus(statusData);
                }
            } catch (err) {
                // Silently ignore if unauthorized
            }
        };
        fetchWaData();
        const interval = setInterval(fetchWaData, 8000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const search = query.trim();
        if (!search) return;
        navigate('/customers-vehicles', { state: { search } });
        setQuery('');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleLogoutClick = () => {
        setDropdownOpen(false);
        onLogout();
    };

    return (
        <div className="header-content">
            <Link to="/dashboard" className="header-logo-mobile">
                <img src={logoIcon} alt="Icon" />
            </Link>

            <button
                type="button"
                className="menu-toggle sidebar-mobile-toggle"
                onClick={onMenuToggle}
                aria-label="Toggle sidebar"
            >
                <FaBars />
            </button>

            <div className="header-context d-none d-lg-block">
                {/* Removed redundant page titles to keep header ultra-clean */}
            </div>

            <form className="search-container" onSubmit={handleSearch} role="search">
                <button type="submit" className="search-btn" aria-label="Search">
                    <FaSearch />
                </button>
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    type="search"
                    placeholder="Search customer, phone, or registration…"
                    aria-label="Search customer, phone, or registration"
                />
                {query && (
                    <button type="submit" className="search-go" aria-label="View search results">
                        <FaArrowRight />
                    </button>
                )}
            </form>

            <div className="header-actions">
                {garage?.is_active === false ? (
                    <div
                        className="badge bg-danger text-white px-3 py-2 me-2 d-none d-md-flex align-items-center"
                        style={{ borderRadius: '20px', fontSize: '11px', letterSpacing: '0.3px' }}
                        title="Garage account suspended by Super Admin"
                    >
                        <FaShieldAlt className="me-1 fs-6" /> 🔒 Account Suspended (Read-Only)
                    </div>
                ) : (
                    <div
                        className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 me-2 d-none d-md-flex align-items-center"
                        style={{ borderRadius: '20px', fontSize: '11px', letterSpacing: '0.3px' }}
                        title="Active License - Cipra Infotech Platform"
                    >
                        <FaShieldAlt className="me-1 fs-6 text-primary" /> ● License Active
                    </div>
                )}

                {waAgentStatus && (
                    <Link
                        to="/settings"
                        className={`badge ${
                            waAgentStatus.isAgentConnected 
                                ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25' 
                                : 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'
                        } border px-3 py-2 me-2 d-none d-md-flex align-items-center text-decoration-none`}
                        style={{ borderRadius: '20px', fontSize: '11px', letterSpacing: '0.3px', cursor: 'pointer' }}
                        title={waAgentStatus.isAgentConnected ? "Workshop PC Agent Online & Connected" : "Workshop PC Agent Offline - Click to launch settings"}
                    >
                        <FaWhatsapp className="me-1 fs-6" />
                        {waAgentStatus.isAgentConnected ? "🟢 Agent Online" : "🔴 Agent Offline"}
                    </Link>
                )}

                {waBalance && waBalance.featureEnabled && waBalance.costingEnabled && (
                    <div
                        className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 me-2 d-none d-md-flex align-items-center"
                        style={{ borderRadius: '20px', fontSize: '12px' }}
                        title="Remaining WhatsApp Credit Balance"
                    >
                        <FaWhatsapp className="me-1 fs-6" />
                        <span className="fw-bold me-1">₹{waBalance.balance.toFixed(2)}</span>
                        <span className="opacity-75">({Math.floor(waBalance.balance / (waBalance.costPerMsg || 0.15))} msgs)</span>
                    </div>
                )}

                <Link to="/reminders" className="notification-icon me-2" aria-label="Open service reminders" title="Service reminders">
                    <FaBell />
                    <span className="notification-pulse" aria-hidden="true"></span>
                </Link>

                <div className="user-profile-container" ref={dropdownRef}>
                    <div
                        className="user-profile"
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                        onClick={() => setDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="user-avatar d-flex align-items-center justify-content-center me-1">
                            <FaUserCircle className="fs-3 text-primary" />
                        </div>
                        <div className="d-flex flex-column text-start ms-1">
                            <span className="user-name fw-bold">{user ? user.name : '...'}</span>
                            {garage?.name && <small className="text-muted" style={{ fontSize: '10px', marginTop: '-3px' }}>{garage.name}</small>}
                        </div>
                    </div>

                    <div className={`user-dropdown ${isDropdownOpen ? 'is-open' : ''}`}>
                        <div className="dropdown-header">
                            <span className="dropdown-user-name">{user ? user.name : 'Loading...'}</span>
                            <span className="dropdown-user-email">{user ? user.email : '...'}</span>
                            {garage?.name && <small className="d-block text-primary fw-bold mt-1">{garage.name}</small>}
                            {user?.is_super_admin && (
                                <span className="badge bg-danger mt-1 text-uppercase" style={{ fontSize: '9px' }}>
                                    Cipra Super Admin
                                </span>
                            )}
                        </div>
                        <hr className="dropdown-divider" />
                        <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <FaCog className="dropdown-item-icon" />
                            <span>Garage & Profile Settings</span>
                        </Link>
                        {user?.is_super_admin && (
                            <Link to="/admin" className="dropdown-item text-danger fw-bold" onClick={() => setDropdownOpen(false)}>
                                <FaShieldAlt className="dropdown-item-icon text-danger" />
                                <span>Super Admin Portal</span>
                            </Link>
                        )}
                        <hr className="dropdown-divider" />
                        <button type="button" className="dropdown-item logout-btn" onClick={handleLogoutClick}>
                            <FaSignOutAlt className="dropdown-item-icon" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
