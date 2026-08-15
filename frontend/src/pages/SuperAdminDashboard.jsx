import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/api.js';
import { 
  FaBuilding, FaCheckCircle, FaUsers, FaUserPlus, FaWhatsapp, 
  FaCog, FaSearch, FaCheck, FaChartLine, FaExclamationTriangle,
  FaFileInvoiceDollar, FaShieldAlt, FaLock, FaKey, FaUser
} from 'react-icons/fa';
import CustomToast from '../components/CustomToast';
import LoadingOverlay from '../components/LoadingOverlay';
import ConfirmModal from '../components/ConfirmModal';

const SuperAdminDashboard = () => {
  const location = useLocation();
  
  const getTabFromPath = (path) => {
    if (path.includes('/admin/garages')) return 'garages';
    if (path.includes('/admin/onboard')) return 'onboard';
    if (path.includes('/admin/whatsapp')) return 'whatsapp';
    if (path.includes('/admin/plans')) return 'plans';
    if (path.includes('/admin/security')) return 'security';
    return 'overview';
  };

  const activeTab = getTabFromPath(location.pathname);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ totalGarages: 0, activeSubscribers: 0, totalUsers: 0 });
  const [garages, setGarages] = useState([]);
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });

  // Onboarding Form State with 3-Tier Commercial Pricing Model
  const [onboardForm, setOnboardForm] = useState({
    garageName: '',
    address: '',
    garagePhone: '',
    garageEmail: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    customMonthlyPrice: '0',
    oneTimeSetupFee: '5000',
    yearlyMaintenanceFee: '10000',
    whatsappCostPerMsg: '0.15',
    whatsappPhoneNumberId: '',
    subscriptionRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    featureStock: true,
    featurePurchase: true,
    featureAnalytics: true,
    featureReminders: true,
    featureTasks: true,
    featureWhatsapp: true,
    initialWhatsappCredits: '100.00'
  });

  // Super Admin Security Profile Form
  const [adminProfileForm, setAdminProfileForm] = useState({ name: 'Cipra Platform Admin', email: 'admin@ciprainfotech.com' });
  const [adminPasswordForm, setAdminPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Edit Garage Modal State
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Top Up Modal State
  const [topUpModal, setTopUpModal] = useState({ isOpen: false, garage: null, amount: '100' });

  useEffect(() => {
    fetchAdminData();
  }, [location.pathname]);

  const showToastNotification = (type, title, message) => {
    setToast({ type, title, message });
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, garagesRes, logsRes, meRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/garages'),
        api.get('/whatsapp/logs'),
        api.get('/auth/me')
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats || {});
      }
      if (garagesRes.ok) {
        const d = await garagesRes.json();
        setGarages(d.garages || []);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setWhatsappLogs(d.logs || []);
      }
      if (meRes.ok) {
        const d = await meRes.json();
        if (d.user) {
          setAdminProfileForm({ name: d.user.name || '', email: d.user.email || '' });
        }
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      showToastNotification('error', 'Error', 'Failed to load platform data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/onboard-garage', onboardForm);
      const data = await res.json();
      if (res.ok) {
        showToastNotification('success', 'Onboarding Complete', `Client "${data.garage?.name}" onboarded successfully!`);
        setOnboardForm({
          garageName: '', address: '', garagePhone: '', garageEmail: '',
          ownerName: '', ownerEmail: '', ownerPhone: '', password: '',
          customMonthlyPrice: '0', oneTimeSetupFee: '5000', yearlyMaintenanceFee: '10000',
          whatsappCostPerMsg: '0.15', subscriptionRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          featureStock: true, featurePurchase: true, featureAnalytics: true, featureReminders: true,
          featureTasks: true, featureWhatsapp: true, initialWhatsappCredits: '100.00'
        });
        fetchAdminData();
      } else {
        showToastNotification('error', 'Onboarding Failed', data.message || 'Error onboarding client.');
      }
    } catch (err) {
      showToastNotification('error', 'Network Error', 'Could not connect to backend server.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (garage) => {
    setSelectedGarage(garage);
    setEditForm({
      custom_monthly_price: garage.custom_monthly_price || '0',
      one_time_setup_fee: garage.one_time_setup_fee || '0',
      yearly_maintenance_fee: garage.yearly_maintenance_fee || '0',
      subscription_renewal_date: garage.subscription_renewal_date ? garage.subscription_renewal_date.split('T')[0] : '',
      whatsapp_cost_per_msg: garage.whatsapp_cost_per_msg || '0.15',
      whatsapp_phone_number_id: garage.whatsapp_phone_number_id || '',
      feature_stock: garage.feature_stock !== false,
      feature_purchase: garage.feature_purchase !== false,
      feature_analytics: garage.feature_analytics !== false,
      feature_reminders: garage.feature_reminders !== false,
      feature_tasks: garage.feature_tasks !== false,
      feature_whatsapp: garage.feature_whatsapp !== false,
      feature_whatsapp_utility: garage.feature_whatsapp_utility !== false,
      feature_whatsapp_marketing: garage.feature_whatsapp_marketing !== false,
      feature_whatsapp_costing: garage.feature_whatsapp_costing !== false,
      feature_payroll: garage.feature_payroll !== false,
      is_active: garage.is_active !== false,
      whatsapp_agent_download_enabled: garage.whatsapp_agent_download_enabled === true
    });
  };

  const handleSaveEditGarage = async (e) => {
    e.preventDefault();
    if (!selectedGarage) return;
    setSaving(true);
    try {
      const res = await api.put(`/admin/garages/${selectedGarage.id}/subscription`, editForm);
      const data = await res.json();
      if (res.ok) {
        showToastNotification('success', 'Settings Saved', `Updated configuration for ${selectedGarage.name}`);
        setSelectedGarage(null);
        fetchAdminData();
      } else {
        showToastNotification('error', 'Update Failed', data.message || 'Error updating settings.');
      }
    } catch (err) {
      showToastNotification('error', 'Error', 'Failed to update garage configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    if (!topUpModal.garage) return;
    setSaving(true);
    try {
      const res = await api.post(`/admin/garages/${topUpModal.garage.id}/topup-whatsapp`, {
        amount: topUpModal.amount
      });
      const data = await res.json();
      if (res.ok) {
        showToastNotification('success', 'Credits Recharged', `Recharged ₹${parseFloat(topUpModal.amount).toFixed(2)} WhatsApp credits!`);
        setTopUpModal({ isOpen: false, garage: null, amount: '100' });
        fetchAdminData();
      } else {
        showToastNotification('error', 'Top-up Failed', data.message || 'Error topping up credits.');
      }
    } catch (err) {
      showToastNotification('error', 'Error', 'Server error topping up credits.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGarageActive = (garage) => {
    const isCurrentlyActive = garage.is_active !== false;
    const actionText = isCurrentlyActive ? 'Suspend' : 'Activate';
    
    setConfirmModal({
      isOpen: true,
      title: `${actionText} Garage License`,
      message: `Are you sure you want to ${actionText.toLowerCase()} "${garage.name}"? ${isCurrentlyActive ? 'This will place their account into strict read-only mode.' : 'This will restore full workspace access.'}`,
      action: async () => {
        setSaving(true);
        try {
          const res = await api.put(`/admin/garages/${garage.id}/toggle-status`);
          const data = await res.json();
          if (res.ok) {
            showToastNotification('success', 'Status Updated', data.message);
            fetchAdminData();
          } else {
            showToastNotification('error', 'Update Failed', data.message);
          }
        } catch (err) {
          showToastNotification('error', 'Error', 'Failed to toggle garage active status.');
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleAdminProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/profile', adminProfileForm);
      const data = await res.json();
      if (res.ok) {
        showToastNotification('success', 'Profile Updated', 'Super Admin profile details updated successfully.');
      } else {
        showToastNotification('error', 'Update Failed', data.message || 'Error updating admin profile.');
      }
    } catch (err) {
      showToastNotification('error', 'Error', 'Failed to update Super Admin profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminPasswordUpdate = async (e) => {
    e.preventDefault();
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      showToastNotification('error', 'Validation Error', 'New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/admin/password', {
        currentPassword: adminPasswordForm.currentPassword,
        newPassword: adminPasswordForm.newPassword
      });
      const data = await res.json();
      if (res.ok) {
        showToastNotification('success', 'Password Updated', 'Super Admin password updated successfully.');
        setAdminPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToastNotification('error', 'Update Failed', data.message || 'Error updating password.');
      }
    } catch (err) {
      showToastNotification('error', 'Error', 'Failed to update Super Admin password.');
    } finally {
      setSaving(false);
    }
  };

  const filteredGarages = garages.filter(g => 
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid p-0">
      <LoadingOverlay isVisible={loading || saving} message={saving ? 'Processing changes...' : 'Loading portal data...'} />
      {toast && <CustomToast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}
      
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          if (confirmModal.action) confirmModal.action();
          setConfirmModal({ isOpen: false, title: '', message: '', action: null });
        }}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', action: null })}
      />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.5px' }}>Platform Overview</h2>
              <p className="text-muted mb-0" style={{ color: '#64748B' }}>High-level executive metrics & multi-tenant GMS controls.</p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-3">
              <div 
                className="card border-0 shadow-sm p-4 rounded-4" 
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-uppercase fw-bold" style={{ color: '#64748B', fontSize: '11px', letterSpacing: '0.8px' }}>
                    Total Garages
                  </span>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center" 
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', width: '46px', height: '46px', border: '1px solid #C7D2FE' }}
                  >
                    <FaBuilding size={20} />
                  </div>
                </div>
                <h2 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '2.2rem' }}>{stats.totalGarages}</h2>
                <small className="fw-bold d-flex align-items-center" style={{ color: '#16A34A', fontSize: '12px' }}>
                  <FaCheck className="me-1" /> Active Client Garages
                </small>
              </div>
            </div>

            <div className="col-md-3">
              <div 
                className="card border-0 shadow-sm p-4 rounded-4" 
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-uppercase fw-bold" style={{ color: '#64748B', fontSize: '11px', letterSpacing: '0.8px' }}>
                    Active Paid Licenses
                  </span>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center" 
                    style={{ backgroundColor: '#ECFDF5', color: '#059669', width: '46px', height: '46px', border: '1px solid #A7F3D0' }}
                  >
                    <FaCheckCircle size={20} />
                  </div>
                </div>
                <h2 className="fw-bold mb-1" style={{ color: '#059669', fontSize: '2.2rem' }}>{stats.activeSubscribers}</h2>
                <small className="text-muted d-block" style={{ fontSize: '12px', color: '#64748B' }}>Active Subscriptions</small>
              </div>
            </div>

            <div className="col-md-3">
              <div 
                className="card border-0 shadow-sm p-4 rounded-4" 
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-uppercase fw-bold" style={{ color: '#64748B', fontSize: '11px', letterSpacing: '0.8px' }}>
                    Registered Users
                  </span>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center" 
                    style={{ backgroundColor: '#E0F2FE', color: '#0284C7', width: '46px', height: '46px', border: '1px solid #BAE6FD' }}
                  >
                    <FaUsers size={20} />
                  </div>
                </div>
                <h2 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '2.2rem' }}>{stats.totalUsers}</h2>
                <small className="fw-bold d-flex align-items-center" style={{ color: '#0284C7', fontSize: '12px' }}>
                  <FaChartLine className="me-1" /> Active Accounts
                </small>
              </div>
            </div>

            <div className="col-md-3">
              <div 
                className="card border-0 shadow-sm p-4 rounded-4" 
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-uppercase fw-bold" style={{ color: '#64748B', fontSize: '11px', letterSpacing: '0.8px' }}>
                    Platform Credits
                  </span>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center" 
                    style={{ backgroundColor: '#FEF3C7', color: '#D97706', width: '46px', height: '46px', border: '1px solid #FDE68A' }}
                  >
                    <FaWhatsapp size={20} />
                  </div>
                </div>
                <h2 className="fw-bold mb-1" style={{ color: '#D97706', fontSize: '2.2rem' }}>
                  ₹{parseFloat(stats.totalWhatsappCredits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
                <small className="text-muted d-block" style={{ fontSize: '12px', color: '#64748B' }}>WhatsApp Credits Issued</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLIENTS & GARAGES TAB WITH 3-TIER COMMERCIAL MODEL */}
      {(activeTab === 'garages' || activeTab === 'overview' || activeTab === 'plans') && (
        <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-bottom" style={{ borderColor: '#F1F5F9' }}>
            <div>
              <h5 className="mb-1 fw-bold" style={{ color: '#0F172A' }}>Client Directory & Commercial Controls</h5>
              <small className="text-muted" style={{ color: '#64748B' }}>Manage One-Time Setup Fee, Yearly Maintenance, Meta WhatsApp messaging rates, & module toggles.</small>
            </div>
            <div className="position-relative" style={{ width: '280px' }}>
              <input 
                type="text" 
                className="form-control form-control-sm bg-light text-dark ps-4 py-2" 
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                placeholder="Search garage or owner..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted" style={{ fontSize: '12px' }} />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-dark" style={{ borderColor: '#E2E8F0' }}>
              <thead style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                <tr>
                  <th className="ps-4 text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px', color: '#475569' }}>Garage & Client</th>
                  <th className="text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px', color: '#475569' }}>Setup Fee (One-Time)</th>
                  <th className="text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px', color: '#475569' }}>Yearly Maintenance</th>
                  <th className="text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px', color: '#475569' }}>WhatsApp Status & Credits</th>
                  <th className="text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px', color: '#475569' }}>Status</th>
                  <th className="pe-4 text-end text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px', color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGarages.length > 0 ? (
                  filteredGarages.map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}>
                      <td className="ps-4 py-3">
                        <div className="fw-bold" style={{ color: '#0F172A', fontSize: '14px' }}>{g.name}</div>
                        <small className="text-muted" style={{ color: '#64748B' }}>{g.owner_name} ({g.owner_email})</small>
                      </td>
                      <td>
                        <div className="fw-bold text-dark fs-6">
                          ₹{parseFloat(g.one_time_setup_fee || 0).toLocaleString('en-IN')}
                        </div>
                        <small className="text-muted" style={{ fontSize: '11px', color: '#64748B' }}>Setup & Installation</small>
                      </td>
                      <td>
                        <div className="fw-bold text-primary fs-6" style={{ color: '#4F46E5' }}>
                          ₹{parseFloat(g.yearly_maintenance_fee || 0).toLocaleString('en-IN')}/yr
                        </div>
                        <small className="text-muted" style={{ fontSize: '11px', color: '#64748B' }}>
                          Renews: {g.subscription_renewal_date ? new Date(g.subscription_renewal_date).toLocaleDateString() : 'N/A'}
                        </small>
                      </td>
                      <td>
                        <div className="mb-1">
                          {g.whatsapp_phone_number_id ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '11px' }}>
                              🟢 Meta API Active
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '11px' }}>
                              🟡 Unassigned Phone ID
                            </span>
                          )}
                        </div>
                        <div className="fw-bold text-dark" style={{ fontSize: '12px' }}>
                          Balance: ₹{parseFloat(g.whatsapp_credit_balance || 0).toFixed(2)}
                        </div>
                        <small className="text-muted" style={{ fontSize: '11px', color: '#64748B' }}>
                          Rate: ₹{parseFloat(g.whatsapp_cost_per_msg || 0.15).toFixed(2)}/msg
                        </small>
                      </td>
                      <td>
                        {g.is_active ? (
                          <div>
                            <span 
                              className="badge px-2.5 py-1.5 rounded-pill fw-bold d-inline-flex align-items-center mb-1"
                              style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', fontSize: '11px' }}
                            >
                              <span className="me-1.5" style={{ fontSize: '8px' }}>●</span> Active License
                            </span>
                            <div className="small text-muted" style={{ fontSize: '11px', color: '#64748B' }}>
                              {[g.feature_stock, g.feature_purchase, g.feature_analytics, g.feature_reminders, g.feature_tasks, g.feature_whatsapp, g.feature_payroll].filter(Boolean).length}/7 Modules Active
                            </div>
                          </div>
                        ) : (
                          <span 
                            className="badge px-2.5 py-1.5 rounded-pill fw-bold d-inline-flex align-items-center"
                            style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: '11px' }}
                          >
                            🔒 Suspended
                          </span>
                        )}
                      </td>
                      <td className="pe-4 text-end text-nowrap">
                        <button 
                          className="btn btn-sm btn-outline-success fw-bold rounded-pill px-2.5 py-1 me-1 shadow-sm"
                          onClick={() => setTopUpModal({ isOpen: true, garage: g, amount: '100' })}
                          title="Recharge WhatsApp Credits"
                        >
                          ⚡ Top-Up
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-primary fw-bold rounded-pill px-2.5 py-1 me-1 shadow-sm"
                          onClick={() => handleOpenEditModal(g)}
                          title="Configure Features & Pricing Tiers"
                        >
                          <FaCog className="me-1" /> Configure
                        </button>
                        <button 
                          className={`btn btn-sm fw-bold rounded-pill px-2.5 py-1 shadow-sm ${g.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => handleToggleGarageActive(g)}
                          title={g.is_active ? "Suspend License (Full Lockout)" : "Activate License"}
                        >
                          {g.is_active ? '🔒 Suspend' : '✅ Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted p-5">
                      No client garages found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONBOARD TAB WITH 3-TIER COMMERCIAL MODEL */}
      {activeTab === 'onboard' && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h4 className="fw-bold mb-2" style={{ color: '#0f172a' }}>
            <FaUserPlus className="me-2 text-primary" /> Onboard New Garage Client (3-Tier Plan Model)
          </h4>
          <p className="text-muted mb-4">Set custom One-Time Setup Fee, Yearly Maintenance Fee, and Meta API WhatsApp charges.</p>

          <form onSubmit={handleOnboardSubmit}>
            <h6 className="fw-bold text-primary mb-3">1. Garage Business Profile & Custom 3-Tier Commercial Fees</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">Garage Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={onboardForm.garageName}
                  onChange={(e) => setOnboardForm({ ...onboardForm, garageName: e.target.value })}
                  required 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">One-Time Setup Fee (₹ X)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={onboardForm.oneTimeSetupFee}
                  onChange={(e) => setOnboardForm({ ...onboardForm, oneTimeSetupFee: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">Yearly Maintenance Fee (₹ Y/year)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={onboardForm.yearlyMaintenanceFee}
                  onChange={(e) => setOnboardForm({ ...onboardForm, yearlyMaintenanceFee: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">Meta WhatsApp Charge (₹ Z/message)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  value={onboardForm.whatsappCostPerMsg}
                  onChange={(e) => setOnboardForm({ ...onboardForm, whatsappCostPerMsg: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">Meta WhatsApp Phone Number ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. 111222333444555"
                  value={onboardForm.whatsappPhoneNumberId}
                  onChange={(e) => setOnboardForm({ ...onboardForm, whatsappPhoneNumberId: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">Subscription Renewal Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={onboardForm.subscriptionRenewalDate}
                  onChange={(e) => setOnboardForm({ ...onboardForm, subscriptionRenewalDate: e.target.value })}
                   />
              </div>
            </div>

            <h6 className="fw-bold text-primary mb-3">2. Owner Account Credentials</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">Owner Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={onboardForm.ownerName}
                  onChange={(e) => setOnboardForm({ ...onboardForm, ownerName: e.target.value })}
                  required 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">Owner Login Email *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={onboardForm.ownerEmail}
                  onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                  required 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-bold small">Initial Password *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={onboardForm.password}
                  onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                  minLength="6"
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg fw-bold px-5 rounded-pill" disabled={saving}>
              {saving ? 'Onboarding Client...' : 'Complete Client Onboarding'}
            </button>
          </form>
        </div>
      )}

      {/* SUPER ADMIN SECURITY & ACCOUNT SELF-CONTROL TAB */}
      {activeTab === 'security' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h4 className="fw-bold mb-2" style={{ color: '#0f172a' }}>
            <FaLock className="me-2 text-danger" /> Super Admin Security & Account Self-Control
          </h4>
          <p className="text-muted mb-4">Update Super Admin name, login email, and security password.</p>

          <div className="row g-4">
            {/* Update Profile Form */}
            <div className="col-md-6">
              <div className="p-4 border rounded-3 bg-light">
                <h6 className="fw-bold text-dark mb-3"><FaUser className="me-2 text-primary" /> Admin Profile Details</h6>
                <form onSubmit={handleAdminProfileUpdate}>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Super Admin Name</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={adminProfileForm.name}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Super Admin Email</label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={adminProfileForm.email}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary fw-bold px-4 rounded-pill" disabled={saving}>
                    Save Profile Details
                  </button>
                </form>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="col-md-6">
              <div className="p-4 border rounded-3 bg-light">
                <h6 className="fw-bold text-dark mb-3"><FaKey className="me-2 text-danger" /> Security Password Change</h6>
                <form onSubmit={handleAdminPasswordUpdate}>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Current Password</label>
                    <input 
                      type="password" 
                      className="form-control"
                      value={adminPasswordForm.currentPassword}
                      onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">New Password</label>
                    <input 
                      type="password" 
                      className="form-control"
                      value={adminPasswordForm.newPassword}
                      onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })}
                      minLength="6"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="form-control"
                      value={adminPasswordForm.confirmPassword}
                      onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })}
                      minLength="6"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-danger fw-bold px-4 rounded-pill" disabled={saving}>
                    Update Super Admin Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP GATEWAY TAB */}
      {activeTab === 'whatsapp' && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h4 className="fw-bold mb-2" style={{ color: '#0f172a' }}>
            <FaWhatsapp className="me-2 text-success" /> WhatsApp API Gateway & Live Audit Logs
          </h4>
          <p className="text-muted mb-4">Monitor real backend WhatsApp API dispatch logs, provider status, and credit deductions.</p>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                <tr>
                  <th className="ps-4 text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Timestamp</th>
                  <th className="text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Recipient Phone</th>
                  <th className="text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Message Type</th>
                  <th className="text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Gateway Msg ID</th>

                  <th className="pe-4 text-end text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {whatsappLogs.length > 0 ? (
                  whatsappLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td className="ps-4 text-muted small">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="fw-bold text-dark">{log.recipient_phone}</td>
                      <td>
                        <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '10px' }}>
                          {log.message_type}
                        </span>
                      </td>
                      <td className="text-primary small">{log.gateway_msg_id || '-'}</td>

                      <td className="pe-4 text-end">
                        {log.status === 'sent' ? (
                          <span className="badge bg-success">SENT</span>
                        ) : (
                          <span className="badge bg-danger">{log.status}</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted p-5">
                      No WhatsApp API dispatch logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT GARAGE MODAL WITH 4-CATEGORY MODULE ARCHITECTURE */}
      {selectedGarage && editForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-dark" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <div className="modal-header border-bottom p-4" style={{ borderColor: '#F1F5F9' }}>
                <div>
                  <h5 className="modal-title fw-bold text-dark">Configure 3-Tier Commercial Pricing & Modules</h5>
                  <small style={{ color: '#64748B' }}>Client Garage: <strong style={{ color: '#4F46E5' }}>{selectedGarage.name}</strong></small>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedGarage(null)}></button>
              </div>
              <form onSubmit={handleSaveEditGarage}>
                <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {/* SECTION 1: COMMERCIAL PRICING */}
                  <div className="p-3 mb-4 rounded-3 border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                    <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#4F46E5' }}>
                      💳 1. Commercial SaaS Pricing Tiers & Meta API Rates
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold" style={{ color: '#475569' }}>One-Time Setup Fee (₹ X)</label>
                        <input 
                          type="number" 
                          className="form-control"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}
                          value={editForm.one_time_setup_fee}
                          onChange={(e) => setEditForm({ ...editForm, one_time_setup_fee: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold" style={{ color: '#475569' }}>Yearly Maintenance Fee (₹ Y/yr)</label>
                        <input 
                          type="number" 
                          className="form-control"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}
                          value={editForm.yearly_maintenance_fee}
                          onChange={(e) => setEditForm({ ...editForm, yearly_maintenance_fee: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold" style={{ color: '#475569' }}>Meta WhatsApp Rate (₹ Z/msg)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-control"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}
                          value={editForm.whatsapp_cost_per_msg}
                          onChange={(e) => setEditForm({ ...editForm, whatsapp_cost_per_msg: e.target.value })}
                          required 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold" style={{ color: '#475569' }}>Meta Phone Number ID</label>
                        <input 
                          type="text" 
                          className="form-control"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}
                          placeholder="e.g. 1202739572931345"
                          value={editForm.whatsapp_phone_number_id}
                          onChange={(e) => setEditForm({ ...editForm, whatsapp_phone_number_id: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold" style={{ color: '#475569' }}>Subscription Renewal Date</label>
                        <input 
                          type="date" 
                          className="form-control"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}
                          value={editForm.subscription_renewal_date}
                          onChange={(e) => setEditForm({ ...editForm, subscription_renewal_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: LICENSE CONTROL */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ color: '#0F172A' }}>🔒 2. Workspace Access Control</h6>
                    <div className={`form-check form-switch p-3 border rounded ${editForm.is_active ? 'bg-light border-success-subtle' : 'bg-danger-subtle border-danger'}`}>
                      <input 
                        className="form-check-input ms-0 me-3" 
                        type="checkbox" 
                        id="edit_is_active" 
                        checked={editForm.is_active} 
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} 
                      />
                      <label className={`form-check-label fw-bold ${editForm.is_active ? 'text-success' : 'text-danger'}`} htmlFor="edit_is_active">
                        {editForm.is_active ? '● Garage Workspace License Active' : '🔒 Garage License Suspended (Full Lockout Screen)'}
                      </label>
                    </div>
                  </div>

                  {/* SECTION 3: 4-CATEGORY MODULE SWITCHES */}
                  <h6 className="fw-bold mb-3" style={{ color: '#0F172A' }}>🧩 3. Modular Feature Matrix (Enable/Disable Features)</h6>
                  
                  {/* CATEGORY A: WORKSHOP OPERATIONS */}
                  <div className="mb-3">
                    <small className="fw-bold text-uppercase d-block mb-2" style={{ color: '#4F46E5', fontSize: '11px', letterSpacing: '0.5px' }}>
                      A. Operations & Inventory Management
                    </small>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_stock" checked={editForm.feature_stock} onChange={(e) => setEditForm({ ...editForm, feature_stock: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_stock">Stock & Inventory Management</label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_purchase" checked={editForm.feature_purchase} onChange={(e) => setEditForm({ ...editForm, feature_purchase: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_purchase">Purchase Entry & Vendor Bills</label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_payroll" checked={editForm.feature_payroll} onChange={(e) => setEditForm({ ...editForm, feature_payroll: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_payroll">Staff Attendance & Payroll Engine</label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_tasks" checked={editForm.feature_tasks} onChange={(e) => setEditForm({ ...editForm, feature_tasks: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_tasks">Internal Tasks & Job Assignments</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CATEGORY B: ANALYTICS & REMINDERS */}
                  <div className="mb-3">
                    <small className="fw-bold text-uppercase d-block mb-2" style={{ color: '#0284C7', fontSize: '11px', letterSpacing: '0.5px' }}>
                      B. Intelligence, Analytics & Reminders
                    </small>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_analytics" checked={editForm.feature_analytics} onChange={(e) => setEditForm({ ...editForm, feature_analytics: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_analytics">Financial Analytics & P&L Reports</label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_reminders" checked={editForm.feature_reminders} onChange={(e) => setEditForm({ ...editForm, feature_reminders: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_reminders">Service & Due Payment Reminders</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CATEGORY C: META WHATSAPP GATEWAY */}
                  <div>
                    <small className="fw-bold text-uppercase d-block mb-2" style={{ color: '#16A34A', fontSize: '11px', letterSpacing: '0.5px' }}>
                      C. Meta WhatsApp Cloud Gateway Controls
                    </small>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_whatsapp" checked={editForm.feature_whatsapp} onChange={(e) => setEditForm({ ...editForm, feature_whatsapp: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_whatsapp">WhatsApp Gateway (Global Master Switch)</label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_whatsapp_utility" checked={editForm.feature_whatsapp_utility} onChange={(e) => setEditForm({ ...editForm, feature_whatsapp_utility: e.target.checked })} disabled={!editForm.feature_whatsapp} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_whatsapp_utility">Utility Messages (Invoices, Receipts)</label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_whatsapp_marketing" checked={editForm.feature_whatsapp_marketing} onChange={(e) => setEditForm({ ...editForm, feature_whatsapp_marketing: e.target.checked })} disabled={!editForm.feature_whatsapp} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_whatsapp_marketing">Marketing Broadcasts & Promos</label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_whatsapp_costing" checked={editForm.feature_whatsapp_costing} onChange={(e) => setEditForm({ ...editForm, feature_whatsapp_costing: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_whatsapp_costing">WhatsApp Credit Costing System</label>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="form-check form-switch p-2.5 border rounded bg-white">
                          <input className="form-check-input ms-0 me-3" type="checkbox" id="edit_whatsapp_agent_download_enabled" checked={editForm.whatsapp_agent_download_enabled} onChange={(e) => setEditForm({ ...editForm, whatsapp_agent_download_enabled: e.target.checked })} />
                          <label className="form-check-label text-dark fw-semibold small" htmlFor="edit_whatsapp_agent_download_enabled">Enable "Download 1-Click Agent Setup" Button for Non-Tech Owners</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top p-4" style={{ borderColor: '#F1F5F9' }}>
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setSelectedGarage(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold rounded-pill px-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', border: 'none' }}>
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TOP UP MODAL */}
      {topUpModal.isOpen && topUpModal.garage && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-dark" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <div className="modal-header border-bottom p-4" style={{ borderColor: '#F1F5F9' }}>
                <h5 className="modal-title fw-bold text-dark">Recharge WhatsApp Credits</h5>
                <button type="button" className="btn-close" onClick={() => setTopUpModal({ isOpen: false, garage: null, amount: '100' })}></button>
              </div>
              <form onSubmit={handleTopUpSubmit}>
                <div className="modal-body p-4">
                  <p className="text-muted mb-1">Garage: <strong className="text-dark">{topUpModal.garage.name}</strong></p>
                  <p className="text-muted mb-3">Current Balance: <strong className="text-success fs-6">₹{parseFloat(topUpModal.garage.whatsapp_credit_balance || 0).toFixed(2)}</strong></p>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Recharge Amount (₹)</label>
                    <input 
                      type="number" 
                      className="form-control form-control-lg text-dark"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1' }}
                      value={topUpModal.amount}
                      onChange={(e) => setTopUpModal({ ...topUpModal, amount: e.target.value })}
                      min="1"
                      required 
                    />
                  </div>
                </div>
                <div className="modal-footer border-top p-4" style={{ borderColor: '#F1F5F9' }}>
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setTopUpModal({ isOpen: false, garage: null, amount: '100' })}>Cancel</button>
                  <button type="submit" className="btn btn-success fw-bold rounded-pill px-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none' }}>Recharge Credits</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
