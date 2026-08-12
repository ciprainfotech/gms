import React, { useState, useEffect, useRef } from 'react';
import { Link, useOutletContext, Navigate } from 'react-router-dom';
import { Container, Card, Table, Button, Row, Col, Badge, Tabs, Tab, Form, InputGroup, Nav, ButtonGroup, Image } from 'react-bootstrap';
import { FaPaperPlane, FaTools, FaWhatsapp, FaPaperPlane as FaSendAll, FaBullhorn, FaLock, FaUsers, FaBold, FaItalic, FaStrikethrough, FaImage, FaTimes } from 'react-icons/fa';
import api from '../api/api.js';
import CustomToast from '../components/CustomToast';
import LoadingOverlay from '../components/LoadingOverlay';
import ConfirmModal from '../components/ConfirmModal';

const RemindersPage = () => {
  const { activeGarage } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [dueServices, setDueServices] = useState([]);
  const [toast, setToast] = useState(null);
  
  // Marketing State
  const [marketingMsg, setMarketingMsg] = useState('');
  const [marketingAudience, setMarketingAudience] = useState('due_services'); // 'due_services' | 'all'
  const [allCustomers, setAllCustomers] = useState([]);
  const [posterPreview, setPosterPreview] = useState(null);
  
  const [activeTab, setActiveTab] = useState('services');
  
  const textAreaRef = useRef(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });

  useEffect(() => {
    if (activeGarage?.feature_reminders) {
      fetchReminders();
      fetchAllCustomers();
    }
  }, [activeGarage]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/reminders');
      if (res.ok) {
        const data = await res.json();
        setDueServices(data.dueServices || []);
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Failed to load reminders data.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      const res = await api.get('/customers');
      if (res.ok) {
        const data = await res.json();
        setAllCustomers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch customers for marketing', err);
    }
  };

  if (activeGarage && !activeGarage.feature_reminders) {
    return (
      <Container className="py-5 text-center">
        <Card className="border-0 shadow-sm p-5 mt-5 mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <FaLock size="4em" className="text-muted mb-4" />
            <h3 className="fw-bold text-dark">Module Locked</h3>
            <p className="text-muted">The Reminders & Marketing module is not enabled for your garage. Please contact your Super Admin to upgrade or enable this feature.</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // --- SERVICE REMINDERS DISPATCH ---

  const confirmSendService = (svc) => {
    if (!activeGarage) {
      setToast({ type: 'error', title: 'Error', message: 'Garage profile not loaded yet.' });
      return;
    }
    if (!activeGarage.feature_whatsapp) {
      setToast({ type: 'error', title: 'Feature Disabled', message: 'WhatsApp Messaging is disabled globally for your account. Contact support.' });
      return;
    }
    if (activeGarage.feature_whatsapp_utility === false) {
      setToast({ type: 'error', title: 'Feature Disabled', message: 'Utility transactional messaging is disabled for your account.' });
      return;
    }
    if (activeGarage.whatsapp_status !== 'connected') {
      setToast({ type: 'error', title: 'WhatsApp Disconnected', message: 'WhatsApp is not connected. Please scan the QR code in settings.' });
      return;
    }
    if (!svc.customer_phone) {
      setToast({ type: 'error', title: 'Missing Phone Number', message: 'Customer phone number is missing. Cannot dispatch WhatsApp message.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm WhatsApp Dispatch',
      message: `Send vehicle service due reminder WhatsApp to ${svc.customer_name} (${svc.customer_phone || 'No phone'}) for car ${svc.car_number}? ₹0.15 will be deducted.`,
      action: () => executeSendServiceWhatsApp(svc)
    });
  };

  const executeSendServiceWhatsApp = async (svc) => {
    setProcessing(true);
    setProgressMsg(`Sending WhatsApp to ${svc.customer_name}...`);
    try {
      const res = await api.post('/whatsapp/send-reminder', {
        phone: svc.customer_phone,
        customerName: svc.customer_name,
        carNumber: svc.car_number,
        type: 'service_reminder'
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'WhatsApp Delivered!', message: data.message });
      } else {
        setToast({ type: 'error', title: data.code === 'INSUFFICIENT_FUNDS' ? 'Balance Exhausted' : 'Dispatch Failed', message: data.message });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Network Error', message: 'Could not connect to WhatsApp backend service.' });
    } finally {
      setProcessing(false);
      setProgressMsg('');
    }
  };

  const confirmSendAllServices = () => {
    if (!activeGarage) {
      setToast({ type: 'error', title: 'Error', message: 'Garage profile not loaded yet.' });
      return;
    }
    if (!activeGarage.feature_whatsapp) {
      setToast({ type: 'error', title: 'Feature Disabled', message: 'WhatsApp Messaging is disabled globally for your account. Contact support.' });
      return;
    }
    if (activeGarage.feature_whatsapp_utility === false) {
      setToast({ type: 'error', title: 'Feature Disabled', message: 'Utility transactional messaging is disabled for your account.' });
      return;
    }
    if (activeGarage.whatsapp_status !== 'connected') {
      setToast({ type: 'error', title: 'WhatsApp Disconnected', message: 'WhatsApp is not connected. Please scan the QR code in settings.' });
      return;
    }
    if (dueServices.length === 0) return;
    const estimatedCost = (dueServices.length * 0.15).toFixed(2);
    setConfirmModal({
      isOpen: true,
      title: 'Bulk WhatsApp Reminders Dispatch',
      message: `Send service reminders to ALL ${dueServices.length} customers? Total estimated credit cost: ₹${estimatedCost}.`,
      action: () => executeBulkServiceDispatch()
    });
  };

  const executeBulkServiceDispatch = async () => {
    setProcessing(true);
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < dueServices.length; i++) {
      const svc = dueServices[i];
      setProgressMsg(`Sending bulk service reminders (${i + 1}/${dueServices.length})...`);
      try {
        const res = await api.post('/whatsapp/send-reminder', {
          phone: svc.customer_phone,
          customerName: svc.customer_name,
          carNumber: svc.car_number,
          type: 'service_reminder'
        });
        if (res.ok) successCount++; else failCount++;
      } catch (e) { failCount++; }
    }
    setProcessing(false);
    setProgressMsg('');
    setToast({ type: successCount > 0 ? 'success' : 'error', title: 'Bulk Dispatch Completed', message: `Dispatched ${successCount} reminders. ${failCount > 0 ? `${failCount} failed.` : ''}` });
  };

  // --- MARKETING DISPATCH ---

  const renderWhatsAppFormatting = (text) => {
    if (!text && !posterPreview) return <span className="text-muted fst-italic">Your message will appear here...</span>;
    if (!text) return null;
    
    // Basic WhatsApp markdown parsing
    const formattedText = text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/~(.*?)~/g, '<del>$1</del>')
      .replace(/\n/g, '<br/>');

    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  const handleFormat = (char) => {
    const el = textAreaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = marketingMsg.substring(start, end);
    const newText = marketingMsg.substring(0, start) + char + selectedText + char + marketingMsg.substring(end);
    setMarketingMsg(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, end + char.length);
    }, 0);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMarketing = () => {
    if (!activeGarage) {
      setToast({ type: 'error', title: 'Error', message: 'Garage profile not loaded yet.' });
      return;
    }
    if (!activeGarage.feature_whatsapp) {
      setToast({ type: 'error', title: 'Feature Disabled', message: 'WhatsApp Messaging is disabled globally for your account. Contact support.' });
      return;
    }
    if (activeGarage.feature_whatsapp_marketing === false) {
      setToast({ type: 'error', title: 'Feature Disabled', message: 'Marketing broadcast messaging is disabled for your account.' });
      return;
    }
    if (activeGarage.whatsapp_status !== 'connected') {
      setToast({ type: 'error', title: 'WhatsApp Disconnected', message: 'WhatsApp is not connected. Please scan the QR code in settings.' });
      return;
    }
    if (!marketingMsg.trim()) {
      setToast({ type: 'error', title: 'Validation Error', message: 'Marketing message cannot be empty.' });
      return;
    }

    const targetList = marketingAudience === 'all' ? allCustomers : dueServices;
    const validTargets = targetList.filter(t => t.phone || t.customer_phone);

    if (validTargets.length === 0) {
      setToast({ type: 'info', title: 'No Targets', message: 'No valid customers with phone numbers found in the selected audience.' });
      return;
    }

    const estimatedCost = (validTargets.length * 0.15).toFixed(2);
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Marketing Broadcast',
      message: `Broadcast this marketing message to ${validTargets.length} customers? Total estimated credit cost: ₹${estimatedCost}.`,
      action: () => executeBulkMarketingDispatch(validTargets)
    });
  };

  const executeBulkMarketingDispatch = async (targets) => {
    setProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const phone = target.phone || target.customer_phone;
      setProgressMsg(`Sending broadcast (${i + 1}/${targets.length})...`);
      try {
        const res = await api.post('/whatsapp/send-marketing', {
          phone: phone,
          message: marketingMsg,
          poster: posterPreview // Backend will handle if implemented
        });
        if (res.ok) successCount++; else failCount++;
      } catch (e) { failCount++; }
    }

    setProcessing(false);
    setProgressMsg('');
    setMarketingMsg('');
    setToast({ type: successCount > 0 ? 'success' : 'error', title: 'Broadcast Completed', message: `Dispatched ${successCount} marketing messages. ${failCount > 0 ? `${failCount} failed.` : ''}` });
  };


  return (
    <Container fluid className="py-4">
      <LoadingOverlay isVisible={loading || processing} message={progressMsg || 'Loading...'} />
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

      <div className="page-header-row mb-4 d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <h2 className="page-title-active mb-1">
            <FaBullhorn className="me-2 text-primary" /> Reminders & Marketing
          </h2>
          <p className="text-muted mb-0 small mt-2">
            Manage upcoming service reminders and broadcast marketing campaigns via WhatsApp.
          </p>
        </div>
        
        <div className="mt-3 mt-md-0">
          <div className="bg-light rounded-pill p-1 border border-light d-inline-flex shadow-sm">
            <Button 
              variant={activeTab === 'services' ? 'primary' : 'transparent'} 
              className={`rounded-pill border-0 fw-bold transition-all px-4 py-2 ${activeTab === 'services' ? 'shadow-sm text-white' : 'text-secondary hover-bg-white'}`}
              onClick={() => setActiveTab('services')}
              style={{ fontSize: '14px' }}
            >
              <FaTools className="me-2" /> Upcoming Services 
              {dueServices.length > 0 && <Badge bg={activeTab === 'services' ? 'white' : 'secondary'} text={activeTab === 'services' ? 'primary' : 'white'} className="ms-2 shadow-sm rounded-pill">{dueServices.length}</Badge>}
            </Button>
            <Button 
              variant={activeTab === 'marketing' ? 'primary' : 'transparent'} 
              className={`rounded-pill border-0 fw-bold transition-all px-4 py-2 ${activeTab === 'marketing' ? 'shadow-sm text-white' : 'text-secondary hover-bg-white'}`}
              onClick={() => setActiveTab('marketing')}
              style={{ fontSize: '14px' }}
            >
              <FaBullhorn className="me-2" /> Broadcast Marketing
            </Button>
          </div>
        </div>
      </div>

      <div className="tab-content-wrapper">
        {activeTab === 'services' && (
          <div className="fade-in">
            {activeGarage?.feature_whatsapp_utility === false && (
              <Alert variant="warning" className="border-0 shadow-sm rounded-3 mb-4 d-flex align-items-center">
                <FaExclamationTriangle className="fs-3 me-3 text-warning flex-shrink-0" />
                <div>
                  <strong>WhatsApp Reminders Disabled</strong>: Your Super Admin has disabled transactional utility messaging. Sending payment statements and reminders via WhatsApp is currently locked.
                </div>
              </Alert>
            )}
            <Card className="saas-card shadow-sm border-0">
              <Card.Header className="bg-white border-bottom border-light py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">Vehicles Due For Service</h5>
                <div className="d-flex gap-2">
                  <Button variant="light" size="sm" onClick={fetchReminders} disabled={processing} className="border border-light fw-bold text-secondary px-3">
                    Refresh
                  </Button>
                  {dueServices.length > 0 && (
                    <Button variant="success" size="sm" className="fw-bold shadow-sm px-3" onClick={confirmSendAllServices} disabled={processing || activeGarage?.feature_whatsapp_utility === false}>
                      <FaSendAll className="me-2" /> Dispatch All
                    </Button>
                  )}
                </div>
              </Card.Header>
              <div className="saas-table-wrapper">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 px-4 border-0">Vehicle & Model</th>
                      <th className="py-3 border-0">Customer</th>
                      <th className="py-3 border-0">Last Service</th>
                      <th className="py-3 border-0">Due Date (6 Months)</th>
                      <th className="py-3 text-center border-0">Action</th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {dueServices.length > 0 ? (
                      dueServices.map((svc) => {
                        const nextDate = new Date(svc.next_service_date);
                        const isOverdue = nextDate < new Date();
                        return (
                          <tr key={svc.id}>
                            <td className="px-4">
                              <div className="fw-bold text-dark">{svc.car_number}</div>
                              <small className="text-muted">{svc.vehicle_model}</small>
                            </td>
                            <td>
                              <div className="fw-bold text-dark">{svc.customer_name}</div>
                              <small className="text-muted">{svc.customer_phone || 'No phone'}</small>
                            </td>
                            <td className="text-muted">
                              {svc.date_completed ? new Date(svc.date_completed).toLocaleDateString('en-GB') : 'N/A'}
                            </td>
                            <td>
                              <strong className={isOverdue ? 'text-danger' : 'text-warning'}>
                                {nextDate.toLocaleDateString('en-GB')}
                              </strong>
                              {isOverdue && <Badge bg="danger" className="ms-2 rounded-pill">Overdue</Badge>}
                            </td>
                            <td className="text-center">
                              <Button 
                                size="sm" 
                                variant="outline-success" 
                                className="rounded-pill px-3 fw-bold bg-success bg-opacity-10 border-0"
                                onClick={() => confirmSendService(svc)}
                                disabled={processing || activeGarage?.feature_whatsapp_utility === false}
                                title={activeGarage?.feature_whatsapp_utility === false ? "WhatsApp Utility Messaging is disabled by Super Admin" : "Send WhatsApp Reminder"}
                              >
                                <FaWhatsapp className="me-1 fs-6" /> Send
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-5">
                          <div className="mb-3"><FaTools size="3em" className="text-light" /></div>
                          <h5 className="fw-bold text-secondary mb-1">All vehicles are up to date!</h5>
                          <p className="small mb-0">No vehicles are due for service in the next 14 days.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="fade-in">
            {activeGarage?.feature_whatsapp_marketing === false ? (
              <Card className="saas-card shadow-sm border-0 text-center py-5">
                <Card.Body className="py-5">
                  <FaLock size="4em" className="text-muted mb-4" />
                  <h3 className="fw-bold text-dark">Marketing Broadcasts Locked</h3>
                  <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
                    Marketing broadcast messaging is disabled for your garage account by your Super Admin. You can still send utility reminders and invoices.
                  </p>
                </Card.Body>
              </Card>
            ) : (
              <Card className="saas-card shadow-sm border-0">
                <Card.Body className="p-4 p-lg-5">
                  <Row className="g-5">
                    <Col lg={7}>
                    <h5 className="fw-bold text-dark mb-2">Compose Broadcast</h5>
                    <p className="text-muted small mb-4">
                      Send custom promotional offers, festival greetings, or camp announcements directly to your customers' WhatsApp.
                    </p>
                    
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold text-secondary small text-uppercase" style={{ letterSpacing: '0.5px' }}>Select Target Audience</Form.Label>
                      <Form.Select 
                        value={marketingAudience} 
                        onChange={(e) => setMarketingAudience(e.target.value)}
                        className="form-control-lg bg-light border-light shadow-none focus-ring focus-ring-light"
                        style={{ fontSize: '15px' }}
                      >
                        <option value="due_services">Customers Due for Service ({dueServices.length} Customers)</option>
                        <option value="all">All Registered Customers ({allCustomers.length} Customers)</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4 position-relative">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="fw-bold text-secondary small text-uppercase mb-0" style={{ letterSpacing: '0.5px' }}>Message Content</Form.Label>
                        <div className="d-flex gap-2">
                          <ButtonGroup size="sm" className="shadow-sm rounded-3">
                            <Button variant="white" className="border border-light text-secondary hover-bg-light" onClick={() => handleFormat('*')} title="Bold">
                              <FaBold />
                            </Button>
                            <Button variant="white" className="border border-light text-secondary hover-bg-light" onClick={() => handleFormat('_')} title="Italic">
                              <FaItalic />
                            </Button>
                            <Button variant="white" className="border border-light text-secondary hover-bg-light" onClick={() => handleFormat('~')} title="Strikethrough">
                              <FaStrikethrough />
                            </Button>
                          </ButtonGroup>
                          
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="d-flex align-items-center shadow-sm rounded-3 fw-bold px-3"
                            onClick={() => document.getElementById('poster-upload').click()}
                          >
                            <FaImage className="me-2" /> Attach Poster
                          </Button>
                          <input 
                            type="file" 
                            id="poster-upload" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleImageUpload}
                          />
                        </div>
                      </div>
                      
                      <Form.Control
                        as="textarea"
                        ref={textAreaRef}
                        rows={8}
                        placeholder="E.g., Special Diwali Offer! Get 20% off on your next car service at Saman Motors. Book your appointment today!"
                        value={marketingMsg}
                        onChange={(e) => setMarketingMsg(e.target.value)}
                        style={{ resize: 'none', fontSize: '15px', lineHeight: '1.6' }}
                        className="bg-light border-light p-3 shadow-none focus-ring focus-ring-light rounded-3"
                      />
                    </Form.Group>

                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-100 fw-bold shadow-sm py-3 rounded-3 mt-2"
                      onClick={handleSendMarketing}
                      disabled={processing || (!marketingMsg.trim() && !posterPreview)}
                    >
                      <FaPaperPlane className="me-2" /> Send Broadcast to {marketingAudience === 'all' ? allCustomers.length : dueServices.length} Customers
                    </Button>
                  </Col>

                  <Col lg={5}>
                    <div className="bg-light p-4 rounded-4 border border-light h-100 position-relative">
                      <h6 className="fw-bold text-secondary mb-4 text-uppercase small" style={{ letterSpacing: '0.5px' }}><FaWhatsapp className="me-2 text-success fs-5" /> Live Preview</h6>
                      
                      {/* WhatsApp Bubble Preview */}
                      <div className="bg-white p-3 rounded-4 shadow-sm position-relative mb-4 mx-auto" style={{ borderTopLeftRadius: 0, maxWidth: '350px' }}>
                        {/* Little chat tail indicator */}
                        <div style={{ position: 'absolute', top: 0, left: '-8px', width: '0', height: '0', borderTop: '15px solid white', borderLeft: '15px solid transparent' }}></div>
                        
                        {posterPreview && (
                          <div className="position-relative mb-2 pb-2 border-bottom border-light">
                            <Image src={posterPreview} fluid rounded className="w-100 object-fit-contain bg-dark rounded-3" style={{ maxHeight: '220px' }} />
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="position-absolute top-0 end-0 m-2 rounded-circle p-1 shadow-sm opacity-75 hover-opacity-100"
                              onClick={() => setPosterPreview(null)}
                              title="Remove Poster"
                            >
                              <FaTimes className="text-danger" />
                            </Button>
                          </div>
                        )}
                        
                        <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap', fontSize: '14.5px', lineHeight: '1.5' }}>
                          {renderWhatsAppFormatting(marketingMsg)}
                        </p>
                        <div className="text-end mt-1">
                          <small className="text-muted" style={{ fontSize: '10px' }}>
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </small>
                        </div>
                      </div>

                      <div className="pt-4 border-top border-light mt-auto">
                        <h6 className="fw-bold text-dark mb-3">Estimated Cost Breakdown</h6>
                        <div className="d-flex justify-content-between small mb-2 text-muted">
                          <span>Target Audience:</span>
                          <strong className="text-dark">{marketingAudience === 'all' ? allCustomers.length : dueServices.length} Customers</strong>
                        </div>
                        <div className="d-flex justify-content-between small mb-3 text-muted">
                          <span>Cost per Message:</span>
                          <strong className="text-dark">₹0.15</strong>
                        </div>
                        <div className="d-flex justify-content-between text-danger p-3 bg-danger bg-opacity-10 rounded-3 border border-danger border-opacity-25">
                          <span className="fw-bold">Total Estimated Deduction:</span>
                          <strong className="fs-5">
                            ₹{((marketingAudience === 'all' ? allCustomers.length : dueServices.length) * 0.15).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default RemindersPage;