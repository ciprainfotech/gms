import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Container, Card, Row, Col, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import PageShell from '../components/ui/PageShell';
import {   FaUser, FaLock, FaBuilding, FaHashtag, FaImage, FaUpload, 
  FaSave, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaKey, FaWhatsapp
} from 'react-icons/fa';
import api, { API_BASE_URL, SERVER_BASE_URL } from '../api/api.js';
import CustomToast from '../components/CustomToast';
import LoadingOverlay from '../components/LoadingOverlay';
import ConfirmModal from '../components/ConfirmModal';

const ProfileSettingsPage = () => {
  const outletContext = useOutletContext();
  const onGarageUpdate = outletContext?.onGarageUpdate;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('garage');

  // User Profile Form
  const [userForm, setUserForm] = useState({ name: '', phone: '', email: '' });
  
  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Garage Profile & Branding Form
  const [garageForm, setGarageForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gst_number: '',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    terms_and_conditions: '',
    invoice_prefix: 'INV-',
    invoice_next_num: 1,
    jobsheet_prefix: 'JS-',
    jobsheet_next_num: 1,
    logo_url: '',
    whatsapp_credit_balance: 0,
    whatsapp_cost_per_msg: 0.15,
    is_active: true,
    one_time_setup_fee: 0,
    yearly_maintenance_fee: 0,
    subscription_renewal_date: null,
    feature_stock: true,
    feature_purchase: true,
    feature_analytics: true,
    feature_reminders: true,
    feature_tasks: true,
    feature_whatsapp: true,
    feature_whatsapp_costing: true,
    whatsapp_agent_download_enabled: false
  });

  // Selected File for Logo Upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrTimer, setQrTimer] = useState(60);

  const [setupNotice, setSetupNotice] = useState(false);

  useEffect(() => {
    fetchProfileData();
    fetchWhatsappStatus();
    if (window.history.state?.usr?.requireProfileSetup) {
      setSetupNotice(true);
      setActiveTab('garage');
    }
    const statusInterval = setInterval(fetchWhatsappStatus, 4000);
    return () => clearInterval(statusInterval);
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserForm({
            name: data.user.name || '',
            phone: data.user.phone || '',
            email: data.user.email || ''
          });
        }
        if (data.garage) {
          setGarageForm({
            name: data.garage.name || '',
            phone: data.garage.phone || '',
            email: data.garage.email || '',
            address: data.garage.address || '',
            gst_number: data.garage.gst_number || '',
            bank_name: data.garage.bank_name || '',
            bank_account_no: data.garage.bank_account_no || '',
            bank_ifsc: data.garage.bank_ifsc || '',
            terms_and_conditions: data.garage.terms_and_conditions || '',
            invoice_prefix: data.garage.invoice_prefix || 'INV-',
            invoice_next_num: data.garage.invoice_next_num || 1,
            jobsheet_prefix: data.garage.jobsheet_prefix || 'JS-',
            jobsheet_next_num: data.garage.jobsheet_next_num || 1,
            logo_url: data.garage.logo_url || '',
            whatsapp_credit_balance: data.garage.whatsapp_credit_balance || 0,
            whatsapp_cost_per_msg: data.garage.whatsapp_cost_per_msg || 0.15,
            is_active: data.garage.is_active !== false,
            one_time_setup_fee: data.garage.one_time_setup_fee || 0,
            yearly_maintenance_fee: data.garage.yearly_maintenance_fee || 0,
            subscription_renewal_date: data.garage.subscription_renewal_date || null,
            feature_stock: data.garage.feature_stock !== false,
            feature_purchase: data.garage.feature_purchase !== false,
            feature_analytics: data.garage.feature_analytics !== false,
            feature_reminders: data.garage.feature_reminders !== false,
            feature_tasks: data.garage.feature_tasks !== false,
            feature_whatsapp: data.garage.feature_whatsapp !== false,
            feature_whatsapp_costing: data.garage.feature_whatsapp_costing !== false,
            whatsapp_agent_download_enabled: data.garage.whatsapp_agent_download_enabled === true
          });
          if (data.garage.logo_url) {
            setLogoPreview(data.garage.logo_url.startsWith('http') ? data.garage.logo_url : `${SERVER_BASE_URL}${data.garage.logo_url}`);
          } else {
            setLogoPreview(null);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setToast({ type: 'error', title: 'Error', message: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setWhatsappStatus(data);
        if (data.status === 'connected') {
          setQrCodeUrl(null);
          setQrLoading(false);
        }
      }
    } catch (err) {
      console.error('Error fetching whatsapp status', err);
    }
  };

  const handleConnectWhatsApp = async () => {
    setQrLoading(true);
    setQrCodeUrl(null);
    setQrTimer(60);
    try {
      const res = await api.get('/whatsapp/qr');
      const data = await res.json();
      if (data.success) {
        if (data.qrCode) {
          setQrCodeUrl(data.qrCode);
          setQrTimer(60);
          setToast({ type: 'info', title: 'QR Ready', message: 'Please scan the QR code with your WhatsApp.' });
          
          // Poll for status change while QR is showing
          const pollInterval = setInterval(async () => {
            const statusRes = await api.get('/whatsapp/status');
            const statusData = await statusRes.json();
            if (statusData.status === 'connected') {
              clearInterval(pollInterval);
              setQrCodeUrl(null);
              setWhatsappStatus(statusData);
              setToast({ type: 'success', title: 'Connected', message: 'WhatsApp Connected Successfully!' });
              if (onGarageUpdate) onGarageUpdate();
            }
          }, 2000);

          // 1-second countdown timer
          const countdownInterval = setInterval(() => {
            setQrTimer((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                clearInterval(pollInterval);
                setQrCodeUrl(null);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

        } else if (data.status === 'connected') {
          setToast({ type: 'success', title: 'Already Connected', message: 'WhatsApp is already connected.' });
          fetchWhatsappStatus();
          if (onGarageUpdate) onGarageUpdate();
        }
      } else {
        setToast({ type: 'error', title: 'Error', message: data.message || 'Failed to generate QR.' });
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', title: 'Error', message: 'Network error generating QR.' });
    } finally {
      setQrLoading(false);
    }
  };

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: null
  });

  const handleDisconnectWhatsApp = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Disconnect WhatsApp',
      message: 'Are you sure you want to disconnect WhatsApp automation? Automated invoice notifications and payment updates will be paused until re-linked.',
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await api.post('/whatsapp/disconnect');
          if (res.ok) {
            setToast({ type: 'success', title: 'Disconnected', message: 'WhatsApp disconnected successfully.' });
            fetchWhatsappStatus();
            if (onGarageUpdate) onGarageUpdate();
          } else {
            setToast({ type: 'error', title: 'Error', message: 'Failed to disconnect WhatsApp.' });
          }
        } catch (err) {
          setToast({ type: 'error', title: 'Error', message: 'Failed to disconnect WhatsApp.' });
        }
      }
    });
  };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile/user', userForm);
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'Profile Updated', message: 'Personal profile details updated successfully.' });
      } else {
        setToast({ type: 'error', title: 'Update Failed', message: data.message || 'Error updating profile.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Failed to update personal profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ type: 'error', title: 'Validation Error', message: 'New password and confirmation do not match.' });
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'Password Changed', message: 'Your password has been changed successfully.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setToast({ type: 'error', title: 'Error', message: data.message || 'Failed to change password.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGarageUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile/garage', garageForm);
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'Garage Settings Saved', message: 'Garage profile & invoice prefixes updated!' });
        if (onGarageUpdate) onGarageUpdate(garageForm);
      } else {
        setToast({ type: 'error', title: 'Update Failed', message: data.message || 'Error updating garage settings.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Failed to update garage settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadLogo = async (e) => {
    e.preventDefault();
    if (!logoFile) {
      setToast({ type: 'error', title: 'No File Selected', message: 'Please choose an image file first.' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const res = await api.upload('/profile/logo', formData);
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'Logo Uploaded', message: 'Garage logo uploaded successfully!' });
        const updatedForm = { ...garageForm, logo_url: data.logo_url };
        setGarageForm(updatedForm);
        setLogoPreview(data.logo_url.startsWith('http') ? data.logo_url : `${SERVER_BASE_URL}${data.logo_url}`);
        if (onGarageUpdate) onGarageUpdate(updatedForm);
      } else {
        setToast({ type: 'error', title: 'Upload Failed', message: data.message || 'Failed to upload logo.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Failed to upload logo image.' });
    } finally {
      setSaving(false);
    }
  };

  const modulesList = [
    { key: 'feature_stock', name: 'Stock & Inventory Management', desc: 'Spare parts stock, inventory tracking & reorder thresholds.' },
    { key: 'feature_purchase', name: 'Purchase Entry & Supplier Bills', desc: 'Recording supplier invoices, vendor ledgers & stock entries.' },
    { key: 'feature_analytics', name: 'Financial Analytics & Reports', desc: 'Revenue analytics, daily earnings, P&L reports.' },
    { key: 'feature_reminders', name: 'Service & Payment Reminders', desc: 'Automated service due notifications & WhatsApp dispatches.' },
    { key: 'feature_tasks', name: 'Task Management & Worksheets', desc: 'Mechanic job sheets & workshop task tracking.' },
    { key: 'feature_whatsapp', name: 'WhatsApp Gateway Integration', desc: 'Direct WhatsApp invoice & reminder sending.' }
  ];

  const initials = (garageForm.name || 'Garage').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <PageShell
      title="Profile & Settings"
      subtitle="Manage your profile, garage branding, and view Super Admin activation capabilities"
      icon={FaBuilding}
    >
      <LoadingOverlay isVisible={loading || saving} message={saving ? 'Saving changes...' : 'Loading profile...'} />
      {toast && <CustomToast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}
      
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {setupNotice && (
        <Alert variant="warning" className="shadow-sm border-0 rounded-3 mb-4 d-flex align-items-center">
          <FaExclamationTriangle className="fs-2 me-3 text-warning" />
          <div>
            <strong className="d-block fs-6 fw-bold">🚀 Initial Profile Completion Required</strong>
            Please fill in your <strong>Garage Helpline Phone Number & Business Address</strong> below and save to activate your workshop workspace and unlock full application navigation.
          </div>
        </Alert>
      )}

      {/* EXECUTIVE SEGMENTED PILL NAVIGATION BAR */}
      <div 
        className="d-flex p-1.5 rounded-3 mb-4 shadow-sm settings-tab-bar" 
        style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('garage')}
          className="btn border-0 py-2.5 px-4 fw-bold rounded-3 d-flex align-items-center"
          style={{
            backgroundColor: activeTab === 'garage' ? '#0f172a' : 'transparent',
            color: activeTab === 'garage' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'garage' ? '0 4px 14px rgba(15,23,42,0.2)' : 'none',
            transition: 'all 0.2s ease-in-out',
            fontSize: '13px'
          }}
        >
          <FaBuilding className="me-2" /> Garage Profile & Branding
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('user')}
          className="btn border-0 py-2.5 px-4 fw-bold rounded-3 d-flex align-items-center"
          style={{
            backgroundColor: activeTab === 'user' ? '#0f172a' : 'transparent',
            color: activeTab === 'user' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'user' ? '0 4px 14px rgba(15,23,42,0.2)' : 'none',
            transition: 'all 0.2s ease-in-out',
            fontSize: '13px'
          }}
        >
          <FaUser className="me-2" /> Personal Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className="btn border-0 py-2.5 px-4 fw-bold rounded-3 d-flex align-items-center"
          style={{
            backgroundColor: activeTab === 'whatsapp' ? '#0f172a' : 'transparent',
            color: activeTab === 'whatsapp' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'whatsapp' ? '0 4px 14px rgba(15,23,42,0.2)' : 'none',
            transition: 'all 0.2s ease-in-out',
            fontSize: '13px'
          }}
        >
          <FaWhatsapp className="me-2" /> WhatsApp Integration
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className="btn border-0 py-2.5 px-4 fw-bold rounded-3 d-flex align-items-center"
          style={{
            backgroundColor: activeTab === 'security' ? '#0f172a' : 'transparent',
            color: activeTab === 'security' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'security' ? '0 4px 14px rgba(15,23,42,0.2)' : 'none',
            transition: 'all 0.2s ease-in-out',
            fontSize: '13px'
          }}
        >
          <FaLock className="me-2" /> Security & Password
        </button>
        
        <button
          type="button"
          onClick={() => setActiveTab('license')}
          className="btn border-0 py-2.5 px-4 fw-bold rounded-3 d-flex align-items-center"
          style={{
            backgroundColor: activeTab === 'license' ? '#0f172a' : 'transparent',
            color: activeTab === 'license' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'license' ? '0 4px 14px rgba(15,23,42,0.2)' : 'none',
            transition: 'all 0.2s ease-in-out',
            fontSize: '13px'
          }}
        >
          <FaShieldAlt className="me-2" /> Plan & Capabilities
        </button>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <Card.Body className="p-4">
          {/* TAB 1: PLAN & MODULE CAPABILITIES */}
          {activeTab === 'license' && (
            <div>
              <div className="mb-4">
                <h5 className="fw-bold text-dark mb-1">Super Admin Controlled License Capabilities</h5>
                <p className="text-muted">Below are your garage account subscription tier and module permissions set by Cipra Infotech Admin.</p>
              </div>

              <Row className="g-4 mb-4">
                <Col md={4}>
                  <div className="p-4 rounded-4 border bg-light">
                    <small className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: '11px' }}>License Status</small>
                    {garageForm.is_active ? (
                      <div className="d-flex align-items-center text-success fw-bold fs-5">
                        <FaCheckCircle className="me-2" /> Active License
                      </div>
                    ) : (
                      <div className="d-flex align-items-center text-danger fw-bold fs-5">
                        <FaExclamationTriangle className="me-2" /> Account Suspended
                      </div>
                    )}
                    <small className="text-muted mt-2 d-block">Controlled by Cipra Infotech Admin</small>
                  </div>
                </Col>

                <Col md={4}>
                  <div className="p-4 rounded-4 border bg-light">
                    <small className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: '11px' }}>Yearly Maintenance</small>
                    <div className="fw-bold text-primary fs-5">
                      ₹{parseFloat(garageForm.yearly_maintenance_fee || 0).toLocaleString('en-IN')}/yr
                    </div>
                    <small className="text-muted mt-2 d-block">
                      Renewal Date: {garageForm.subscription_renewal_date ? new Date(garageForm.subscription_renewal_date).toLocaleDateString() : 'Active'}
                    </small>
                  </div>
                </Col>

                {garageForm.feature_whatsapp_costing !== false && (
                  <Col md={4}>
                    <div className="p-4 rounded-4 border bg-light">
                      <small className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: '11px' }}>WhatsApp Credits & Meta Rate</small>
                      <div className="fw-bold text-dark fs-5">
                        ₹{parseFloat(garageForm.whatsapp_credit_balance || 0).toFixed(2)}
                      </div>
                      <small className="text-muted mt-2 d-block">
                        Meta API Rate: ₹{parseFloat(garageForm.whatsapp_cost_per_msg || 0.15).toFixed(2)}/msg
                      </small>
                    </div>
                  </Col>
                )}
              </Row>

              <h6 className="fw-bold text-dark mb-3">Module Activations & Access Controls</h6>
              <Row className="g-3 mb-4">
                {modulesList.map((m) => {
                  const isEnabled = garageForm[m.key];
                  return (
                    <Col md={6} key={m.key}>
                      <div 
                        className={`p-3 border rounded-3 d-flex align-items-center justify-content-between ${
                          isEnabled ? 'bg-white border-success-subtle' : 'bg-light border-secondary-subtle opacity-75'
                        }`}
                      >
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{m.name}</div>
                          <small className="text-muted" style={{ fontSize: '12px' }}>{m.desc}</small>
                        </div>
                        {isEnabled ? (
                          <Badge bg="success" className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center">
                            <FaCheckCircle className="me-1" /> Active
                          </Badge>
                        ) : (
                          <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center">
                            <FaLock className="me-1" /> Locked
                          </Badge>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>

              <Alert variant="info" className="border-0 shadow-sm rounded-3 d-flex align-items-center">
                <FaShieldAlt className="fs-3 me-3 text-info" />
                <div>
                  <strong className="d-block">Need to unlock additional modules or renew your subscription?</strong>
                  Module activations and custom pricing rates are dynamically managed by Cipra Infotech Super Admin. Please contact <strong>admin@ciprainfotech.com</strong> to upgrade your plan capabilities.
                </div>
              </Alert>
            </div>
          )}

          {/* TAB 2: GARAGE PROFILE & BRANDING */}
          {activeTab === 'garage' && (
            <Form onSubmit={handleGarageUpdate}>
              <Row className="g-4">
                <Col md={8}>
                  <h5 className="fw-bold text-dark mb-3">Garage Profile Information</h5>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Garage Business Name *</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={garageForm.name}
                          onChange={(e) => setGarageForm({ ...garageForm, name: e.target.value })}
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Garage Phone / Helpline</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={garageForm.phone}
                          onChange={(e) => setGarageForm({ ...garageForm, phone: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Garage Contact Email</Form.Label>
                        <Form.Control 
                          type="email" 
                          value={garageForm.email}
                          onChange={(e) => setGarageForm({ ...garageForm, email: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">GST Identification Number (GSTIN)</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={garageForm.gst_number}
                          onChange={(e) => setGarageForm({ ...garageForm, gst_number: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Garage Address</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={2}
                          value={garageForm.address}
                          onChange={(e) => setGarageForm({ ...garageForm, address: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h5 className="fw-bold text-dark mt-4 mb-3">Bank Account & Settlement Details</h5>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Bank Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="e.g. State Bank of India"
                          value={garageForm.bank_name}
                          onChange={(e) => setGarageForm({ ...garageForm, bank_name: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Account Number</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="e.g. 123456789012"
                          value={garageForm.bank_account_no}
                          onChange={(e) => setGarageForm({ ...garageForm, bank_account_no: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">IFSC Code</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="e.g. SBIN0001234"
                          value={garageForm.bank_ifsc}
                          onChange={(e) => setGarageForm({ ...garageForm, bank_ifsc: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Invoice Terms & Conditions</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={3}
                          placeholder="Custom terms and conditions printed on invoices..."
                          value={garageForm.terms_and_conditions}
                          onChange={(e) => setGarageForm({ ...garageForm, terms_and_conditions: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h5 className="fw-bold text-dark mt-4 mb-3">Invoice & Job Sheet Prefix Rules</h5>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Invoice Prefix</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={garageForm.invoice_prefix}
                          onChange={(e) => setGarageForm({ ...garageForm, invoice_prefix: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Next Invoice Number</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={garageForm.invoice_next_num}
                          onChange={(e) => setGarageForm({ ...garageForm, invoice_next_num: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Job Sheet Prefix</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={garageForm.jobsheet_prefix}
                          onChange={(e) => setGarageForm({ ...garageForm, jobsheet_prefix: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Next Job Sheet Number</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={garageForm.jobsheet_next_num}
                          onChange={(e) => setGarageForm({ ...garageForm, jobsheet_next_num: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="mt-4">
                    <Button type="submit" variant="primary" className="fw-bold px-4 rounded-pill" disabled={saving}>
                      <FaSave className="me-2" /> Save Garage Details
                    </Button>
                  </div>
                </Col>

                {/* Logo Preview & Upload */}
                <Col md={4}>
                  <div className="p-4 border rounded-4 bg-light text-center">
                    <h6 className="fw-bold text-dark mb-3">Garage Brand Logo</h6>
                    <div className="mb-3 d-flex align-items-center justify-content-center bg-white p-3 border rounded-3" style={{ height: '140px' }}>
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Garage Logo Preview" 
                          style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                          style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', fontSize: '24px' }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Control type="file" accept="image/*" onChange={handleLogoFileChange} />
                    </Form.Group>
                    <Button variant="outline-primary" className="fw-bold rounded-pill w-100" onClick={handleUploadLogo} disabled={saving}>
                      <FaUpload className="me-2" /> Upload Brand Logo
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          )}

          {/* TAB 3: PERSONAL PROFILE */}
          {activeTab === 'user' && (
            <Form onSubmit={handleUserUpdate}>
              <h5 className="fw-bold text-dark mb-3">Personal Profile Information</h5>
              <Row className="g-3 mb-4" style={{ maxWidth: '600px' }}>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-muted">Full Name *</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      required 
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-muted">Phone Number</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-muted">Email Address (Read Only)</Form.Label>
                    <Form.Control 
                      type="email" 
                      value={userForm.email}
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button type="submit" variant="primary" className="fw-bold px-4 rounded-pill" disabled={saving}>
                <FaSave className="me-2" /> Update Profile
              </Button>
            </Form>
          )}

          {/* TAB 4: WHATSAPP INTEGRATION (STRICT 2-STEP FLOW) */}
          {activeTab === 'whatsapp' && (
            <div>
              <h5 className="fw-bold text-dark mb-2">WhatsApp Web Connection</h5>
              <p className="text-muted mb-4">Connect your garage's WhatsApp number to send automated invoices, job sheets, and payment reminders directly to your customers.</p>
              
              <Row className="g-4" style={{ maxWidth: '750px' }}>
                <Col md={12}>
                  <Card className="border shadow-sm rounded-4 overflow-hidden">
                    <Card.Body className="p-4">
                      {whatsappStatus?.status === 'connected' ? (
                        /* WHATSAPP CONNECTED & READY */
                        <div>
                          <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                            <div className="d-flex align-items-center">
                              <div className="bg-success text-white p-3 rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                                <FaWhatsapp style={{ fontSize: '28px' }} />
                              </div>
                              <div>
                                <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '16px' }}>WhatsApp Status: Connected</h6>
                                <Badge bg="success" className="px-3 py-1.5 rounded-pill" style={{ fontSize: '12px' }}>
                                  🟢 Active & Ready to Send
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              variant="outline-danger" 
                              className="rounded-pill px-4 fw-bold btn-sm"
                              onClick={handleDisconnectWhatsApp}
                            >
                              Disconnect
                            </Button>
                          </div>

                          <Row className="g-3">
                            <Col md={6}>
                              <span className="text-muted small text-uppercase fw-bold d-block mb-1">Linked Phone Number</span>
                              <span className="fw-bold text-dark font-monospace" style={{ fontSize: '15px' }}>
                                {whatsappStatus?.phoneNumber || 'Connected Device'}
                              </span>
                            </Col>
                            <Col md={6}>
                              <span className="text-muted small text-uppercase fw-bold d-block mb-1">Session Mode</span>
                              <span className="fw-bold text-primary" style={{ fontSize: '15px' }}>
                                💻 Local Workshop Computer Bridge
                              </span>
                            </Col>
                          </Row>
                        </div>
                      ) : !whatsappStatus?.isAgentConnected ? (
                        /* STEP 1: AGENT OFFLINE SETUP */
                        <div className="text-center py-3">
                          <div className="bg-danger text-white p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                            <FaWhatsapp style={{ fontSize: '36px' }} />
                          </div>
                          <h5 className="fw-bold text-dark mb-1">Step 1: Start Workshop PC Agent</h5>
                          <Badge bg="danger" className="px-3 py-1.5 rounded-pill mb-3" style={{ fontSize: '12px' }}>
                            🔴 Step 1 Required: Agent Offline
                          </Badge>
                          <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '500px' }}>
                            Before scanning the WhatsApp QR code, you must start the 1-Click Agent on your workshop computer to establish the cloud bridge connection.
                          </p>

                          {garageForm?.whatsapp_agent_download_enabled ? (
                            <>
                              <div className="mb-4">
                                <button 
                                  className="btn btn-success btn-lg rounded-pill px-5 fw-bold shadow-sm"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_BASE_URL}/whatsapp/bridge/token`, { credentials: 'include' });
                                      const data = await res.json();
                                      if (data.success && data.token) {
                                        window.open(`${API_BASE_URL}/whatsapp/bridge/download?token=${data.token}`, '_blank');
                                      } else {
                                        alert('Failed to generate download link. Please try again.');
                                      }
                                    } catch(e) {
                                      alert('Network error. Please check your connection.');
                                    }
                                  }}
                                >
                                  🚀 Download 1-Click Agent Setup
                                </button>
                              </div>

                              <div className="p-3 bg-light rounded-4 text-start mt-3" style={{ maxWidth: '540px', margin: '0 auto' }}>
                                <h6 className="fw-bold text-dark small mb-2">⚡ Quick 3-Step Setup Instructions:</h6>
                                <ol className="small text-muted mb-0 ps-3" style={{ lineHeight: '1.7' }}>
                                  <li>Click the green <strong>Download 1-Click Agent Setup</strong> button above.</li>
                                  <li>Double-click the downloaded <code>.bat</code> file on your workshop PC.</li>
                                  <li>Once launched, <strong>Step 2 (Generate QR Code)</strong> will unlock automatically!</li>
                                </ol>
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : (
                        /* STEP 2: AGENT ONLINE - LINK WHATSAPP QR CODE */
                        <div className="text-center py-3">
                          <div className="bg-success text-white p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                            <FaWhatsapp style={{ fontSize: '36px' }} />
                          </div>
                          <h5 className="fw-bold text-dark mb-1">Step 2: Link WhatsApp Phone Number</h5>
                          <Badge bg="success" className="px-3 py-1.5 rounded-pill mb-3" style={{ fontSize: '12px' }}>
                            🟢 Step 1 Complete: Workshop Agent Online
                          </Badge>
                          <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '480px' }}>
                            Your workshop PC agent is online! Now scan the QR code to link your WhatsApp account.
                          </p>

                          {qrLoading ? (
                            <div className="py-4">
                              <Spinner animation="border" variant="success" className="mb-2" />
                              <p className="text-muted small">Booting local WhatsApp engine & generating QR code...</p>
                            </div>
                          ) : qrCodeUrl && qrTimer > 0 ? (
                            <div className="my-3 p-3 bg-white d-inline-block border rounded-4 shadow-sm text-center">
                              <div className="mb-2">
                                <Badge bg={qrTimer > 15 ? "success" : "danger"} className="px-3 py-1.5 rounded-pill" style={{ fontSize: '13px' }}>
                                  ⏱️ QR Code Expires in {qrTimer}s
                                </Badge>
                              </div>
                              <img src={qrCodeUrl} alt="WhatsApp QR Code" style={{ width: '230px', height: '230px' }} />
                              <div className="mt-2 text-success small fw-bold">
                                📲 Point your phone camera at this QR code
                              </div>
                            </div>
                          ) : (
                            <Button 
                              variant="success" 
                              size="lg"
                              className="rounded-pill px-5 fw-bold shadow-sm mb-4"
                              onClick={handleConnectWhatsApp}
                            >
                              <FaWhatsapp className="me-2" /> {qrTimer === 0 ? '🔄 Refresh Expired QR Code' : 'Generate Connection QR Code'}
                            </Button>
                          )}

                          <div className="p-3 bg-light rounded-4 text-start mt-3" style={{ maxWidth: '540px', margin: '0 auto' }}>
                            <h6 className="fw-bold text-dark small mb-2">How to link your phone:</h6>
                            <ol className="small text-muted mb-0 ps-3" style={{ lineHeight: '1.7' }}>
                              <li>Open <strong>WhatsApp</strong> on your phone.</li>
                              <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> ➔ <strong>Linked Devices</strong>.</li>
                              <li>Tap <strong>Link a Device</strong> and point your camera at the QR code above.</li>
                            </ol>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* TAB 5: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <Form onSubmit={handlePasswordChange}>
              <h5 className="fw-bold text-dark mb-3">Security & Password Change</h5>
              <Row className="g-3 mb-4" style={{ maxWidth: '600px' }}>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-muted">Current Password *</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required 
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-muted">New Password *</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      minLength="6"
                      required 
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-muted">Confirm New Password *</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      minLength="6"
                      required 
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button type="submit" variant="danger" className="fw-bold px-4 rounded-pill" disabled={saving}>
                <FaKey className="me-2" /> Change Password
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </PageShell>
  );
};

export default ProfileSettingsPage;
