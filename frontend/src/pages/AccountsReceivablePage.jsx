import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Row, Col, Spinner, Accordion, ButtonGroup, Alert, Form, InputGroup, Nav, Modal, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    FaMoneyBillWave, FaPaperPlane, FaFileInvoiceDollar, FaUserCircle, FaListUl, FaUsers, FaInfoCircle,
    FaSearch, FaFileDownload, FaPrint, FaCheckCircle, FaExclamationCircle, FaClock, FaCalendarAlt,
    FaFolderOpen, FaFolder, FaTrashAlt, FaShieldAlt
} from 'react-icons/fa';
import api from '../api/api';
import RecordPaymentModal from '../components/RecordPaymentModal';
import CustomerStatementModal from '../components/CustomerStatementModal';
import ConfirmModal from '../components/ConfirmModal';
import CustomToast from '../components/CustomToast';

import PageShell from '../components/ui/PageShell';
import StatCard from '../components/ui/StatCard';
import FilterBar from '../components/ui/FilterBar';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';

// --- Formatter Helpers ---
const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const AccountsReceivablePage = () => {
    const { activeGarage } = useOutletContext();
    // --- Data & UI State ---
    const [invoices, setInvoices] = useState([]);
    const [garageProfile, setGarageProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [toast, setToast] = useState(null); 
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });

    const [loadingStates, setLoadingStates] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [dataVersion, setDataVersion] = useState(0); 
    const [viewMode, setViewMode] = useState('customer'); // 'customer' | 'invoice'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unpaid' | 'paid' | 'partial'
    const [searchTerm, setSearchTerm] = useState('');

    // --- Date Range Filter State ---
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- Accordion Active Keys (Expand/Collapse All) ---
    const [expandedCustomerKeys, setExpandedCustomerKeys] = useState([]);

    // --- Customer Statement Modal State ---
    const [showStatementModal, setShowStatementModal] = useState(false);
    const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState(null);

    // --- Customer Deletion Confirmation Modal State ---
    const [showDeleteCustomerModal, setShowDeleteCustomerModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // --- API Data Fetching ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setFetchError('');
        try {
            const [invoicesRes, profileRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/profile')
            ]);

            if (invoicesRes.ok) {
                const data = await invoicesRes.json();
                setInvoices(data.invoices || data || []);
            } else {
                const errData = await invoicesRes.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to fetch invoice data.');
            }

            if (profileRes.ok) {
                const pData = await profileRes.json();
                setGarageProfile(pData.garage || null);
            }
        } catch (err) {
            console.error('Error fetching accounts receivable:', err);
            setFetchError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, dataVersion]);


    // --- Data Processing & Calculation ---
    const processedInvoices = useMemo(() => {
        return (invoices || []).map(inv => {
            const grandTotal = parseFloat(inv.grand_total || inv.grandTotal || 0);
            
            let amountPaid = parseFloat(inv.total_paid || inv.totalPaid || inv.amount_paid || inv.amountPaid || 0);
            if (inv.paymentRecords && Array.isArray(inv.paymentRecords)) {
                amountPaid = inv.paymentRecords.reduce((sum, p) => sum + parseFloat(p.amountPaid || p.amount_paid || 0), 0);
            } else if (inv.payment_records && Array.isArray(inv.payment_records)) {
                amountPaid = inv.payment_records.reduce((sum, p) => sum + parseFloat(p.amountPaid || p.amount_paid || 0), 0);
            }

            const amountDue = Math.max(0, grandTotal - amountPaid);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Strip time for accurate strict Overdue logic
            
            let isOverdue = false;
            if (amountDue > 0 && (inv.due_date || inv.dueDate)) {
                const dueDate = new Date(inv.due_date || inv.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate < today) {
                    isOverdue = true;
                }
            }

            let calculatedStatus = 'Pending';
            if (amountDue <= 0 && grandTotal >= 0) {
                calculatedStatus = 'Paid';
            } else if (isOverdue) {
                calculatedStatus = 'Overdue';
            } else if (amountPaid > 0 && amountDue > 0) {
                calculatedStatus = 'Partially Paid';
            } else {
                calculatedStatus = 'Unpaid';
            }

            return {
                ...inv,
                id: inv.id,
                invoiceNumber: inv.invoice_number || inv.invoiceNumber,
                dueDate: inv.due_date || inv.dueDate,
                dateIssued: inv.date_issued || inv.dateIssued,
                customerId: inv.customer_id || inv.customerId || 'unknown',
                customerName: inv.customer_name || inv.customerName || 'Unknown Customer',
                customerPhone: inv.customer_phone || inv.customerPhone || '',
                customerEmail: inv.customer_email || inv.customerEmail || '',
                vehicleNumber: inv.vehicle_car_number || inv.vehicle_number || inv.vehicleNumber || 'N/A',
                grandTotal,
                amountPaid,
                amountDue,
                status: calculatedStatus
            };
        });
    }, [invoices]);

    // --- Search, Date Range & Status Filter Application ---
    const filteredInvoices = useMemo(() => {
        return processedInvoices.filter(inv => {
            // Status Tab Filter
            if (statusFilter === 'unpaid' && (inv.status === 'Paid' || inv.amountDue <= 0)) return false;
            if (statusFilter === 'paid' && inv.status !== 'Paid') return false;
            if (statusFilter === 'partial' && inv.status !== 'Partially Paid') return false;

            // Date Range Filter
            const invDateStr = inv.dateIssued || inv.dueDate;
            if (invDateStr) {
                const invDate = new Date(invDateStr);
                if (startDate && new Date(startDate) > invDate) return false;
                if (endDate && new Date(endDate) < invDate) return false;
            }

            // Search Term Filter
            if (searchTerm.trim()) {
                const query = searchTerm.toLowerCase();
                const matchesName = (inv.customerName || '').toLowerCase().includes(query);
                const matchesPhone = (inv.customerPhone || '').toLowerCase().includes(query);
                const matchesInvoice = (inv.invoiceNumber || '').toLowerCase().includes(query);
                const matchesVehicle = (inv.vehicleNumber || '').toLowerCase().includes(query);
                return matchesName || matchesPhone || matchesInvoice || matchesVehicle;
            }

            return true;
        });
    }, [processedInvoices, statusFilter, searchTerm, startDate, endDate]);

    // --- KPI & Customer Grouping Derivation ---
    const { customerWiseDues, kpi } = useMemo(() => {
        const totalBilled = processedInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const totalCollected = processedInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
        const totalOutstanding = processedInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
        const totalOverdue = processedInvoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amountDue, 0);

        // Group by Customer ID
        const grouped = filteredInvoices.reduce((acc, inv) => {
            if (!acc[inv.customerId]) {
                acc[inv.customerId] = {
                    customerId: inv.customerId,
                    customerName: inv.customerName,
                    phone: inv.customerPhone,
                    email: inv.customerEmail,
                    totalBilled: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    invoiceCount: 0,
                    invoices: []
                };
            }
            acc[inv.customerId].totalBilled += inv.grandTotal;
            acc[inv.customerId].totalPaid += inv.amountPaid;
            acc[inv.customerId].totalDue += inv.amountDue;
            acc[inv.customerId].invoiceCount++;
            acc[inv.customerId].invoices.push(inv);
            return acc;
        }, {});

        const customerArray = Object.values(grouped).sort((a, b) => b.totalDue - a.totalDue);

        return {
            customerWiseDues: customerArray,
            kpi: {
                totalBilled,
                totalCollected,
                totalOutstanding,
                totalOverdue,
                totalInvoicesCount: processedInvoices.length,
                pendingCount: processedInvoices.filter(inv => inv.amountDue > 0).length
            }
        };
    }, [processedInvoices, filteredInvoices]);

    // Expand top 3 customer keys by default
    useEffect(() => {
        if (customerWiseDues.length > 0 && expandedCustomerKeys.length === 0) {
            setExpandedCustomerKeys(customerWiseDues.slice(0, 3).map(c => String(c.customerId)));
        }
    }, [customerWiseDues]);

    const handleExpandAll = () => {
        setExpandedCustomerKeys(customerWiseDues.map(c => String(c.customerId)));
    };

    const handleCollapseAll = () => {
        setExpandedCustomerKeys([]);
    };

    // --- Pagination Calculation ---
    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return customerWiseDues.slice(startIndex, startIndex + itemsPerPage);
    }, [customerWiseDues, currentPage, itemsPerPage]);

    const paginatedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredInvoices, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(
        (viewMode === 'customer' ? customerWiseDues.length : filteredInvoices.length) / itemsPerPage
    );


    // --- CSV Export Handler (UTF-8 BOM Blob) ---
    const handleExportCSV = () => {
        if (!filteredInvoices || filteredInvoices.length === 0) return;

        const headers = ["Invoice Number", "Customer Name", "Phone", "Vehicle Number", "Date Issued", "Due Date", "Grand Total (INR)", "Amount Paid (INR)", "Amount Due (INR)", "Status"];
        const rows = filteredInvoices.map(inv => [
            `"${(inv.invoiceNumber || '').replace(/"/g, '""')}"`,
            `"${(inv.customerName || '').replace(/"/g, '""')}"`,
            `"${(inv.customerPhone || '').replace(/"/g, '""')}"`,
            `"${(inv.vehicleNumber || '').replace(/"/g, '""')}"`,
            `"${formatDate(inv.dateIssued)}"`,
            `"${formatDate(inv.dueDate)}"`,
            (inv.grandTotal || 0).toFixed(2),
            (inv.amountPaid || 0).toFixed(2),
            (inv.amountDue || 0).toFixed(2),
            `"${inv.status}"`
        ]);

        const csvString = [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
        const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Accounts_Statement_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // --- Action Handlers ---
    const sendReminderAPI = async (payload) => {
        const response = await api.post('/whatsapp/send-reminder', payload);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to send reminder');
        }
        return await response.json();
    };

    const handleSendSingleReminder = (invoice) => {
        if (!activeGarage) {
            setToast({ type: 'error', title: 'Error', message: 'Workspace profile not loaded yet. Please try again.' });
            return;
        }
        if (!activeGarage.feature_whatsapp) {
            setToast({ type: 'error', title: 'Feature Disabled', message: 'WhatsApp Messaging is disabled globally for your account. Contact Cipra Infotech support.' });
            return;
        }
        if (activeGarage.feature_whatsapp_utility === false) {
            setToast({ type: 'error', title: 'Feature Disabled', message: 'Utility transactional messaging is disabled for your account by your Super Admin.' });
            return;
        }
        if (activeGarage.whatsapp_status !== 'connected') {
            setToast({ type: 'error', title: 'WhatsApp Disconnected', message: 'WhatsApp is not connected. Please scan the QR code in settings.' });
            return;
        }
        if (!invoice.customerPhone) {
            setToast({ type: 'error', title: 'Missing Phone', message: `Cannot send reminder. Customer ${invoice.customerName} does not have a phone number.` });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Confirm Send Reminder',
            message: `Send a WhatsApp payment reminder for Invoice #${invoice.invoiceNumber}?`,
            action: async () => {
                setLoadingStates(prev => ({ ...prev, [invoice.id]: true }));
                try {
                    const payload = {
                        phone: invoice.customerPhone,
                        customerName: invoice.customerName,
                        carNumber: invoice.vehicleNumber,
                        type: 'single_invoice',
                        invoiceNumber: invoice.invoiceNumber,
                        amountDue: invoice.amountDue,
                        invoiceDate: invoice.dateIssued
                    };
                    await sendReminderAPI(payload);
                    setToast({ type: 'success', title: 'Reminder Sent', message: `Reminder sent successfully for Invoice #${invoice.invoiceNumber}.` });
                } catch (error) { 
                    setToast({ type: 'error', title: 'Reminder Failed', message: error.message });
                } finally { 
                    setLoadingStates(prev => ({ ...prev, [invoice.id]: false })); 
                }
            }
        });
    };

    const handleRemindAllForCustomer = (customerId, customerName) => {
        if (!activeGarage) {
            setToast({ type: 'error', title: 'Error', message: 'Workspace profile not loaded yet. Please try again.' });
            return;
        }
        if (!activeGarage.feature_whatsapp) {
            setToast({ type: 'error', title: 'Feature Disabled', message: 'WhatsApp Messaging is disabled globally for your account. Contact Cipra Infotech support.' });
            return;
        }
        if (activeGarage.feature_whatsapp_utility === false) {
            setToast({ type: 'error', title: 'Feature Disabled', message: 'Utility transactional messaging is disabled for your account by your Super Admin.' });
            return;
        }
        if (activeGarage.whatsapp_status !== 'connected') {
            setToast({ type: 'error', title: 'WhatsApp Disconnected', message: 'WhatsApp is not connected. Please scan the QR code in settings.' });
            return;
        }

        const customerData = customerWiseDues.find(c => c.customerId === customerId);
        if (!customerData) return;
        
        const pendingCount = customerData.invoices.filter(i => i.amountDue > 0).length;

        // Check if the customer has a valid phone number from the first invoice or customerData itself
        const customerPhone = customerData.invoices.length > 0 ? customerData.invoices[0].customerPhone : null;
        
        if (!customerPhone) {
            setToast({ type: 'error', title: 'Missing Phone', message: `Cannot send reminders. Customer ${customerName} does not have a phone number.` });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Confirm Send Reminders',
            message: `Send WhatsApp payment reminders to ${customerName} for ${pendingCount} pending invoice(s)?`,
            action: async () => {
                setLoadingStates(prev => ({ ...prev, [`cust-${customerId}`]: true }));
                try {
                    const pendingInvoices = customerData.invoices.filter(i => i.amountDue > 0);
                    const totalDue = pendingInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
                    
                    const payload = {
                        phone: customerPhone,
                        customerName: customerName,
                        type: 'general_reminder',
                        invoiceCount: pendingCount,
                        totalDue: totalDue
                    };
                    
                    await sendReminderAPI(payload);
                    setToast({ type: 'success', title: 'Reminders Sent', message: `Sent general payment reminder to ${customerName}.` });
                } catch (error) { 
                    setToast({ type: 'error', title: 'Error', message: `An error occurred: ${error.message}` });
                } finally { 
                    setLoadingStates(prev => ({ ...prev, [`cust-${customerId}`]: false })); 
                }
            }
        });
    };

    // Statement Modal Handler
    const handleOpenStatementModal = (customerData) => {
        setSelectedCustomerForStatement(customerData);
        setShowStatementModal(true);
    };

    const handleSendLedgerWhatsApp = (customerData, transactions, totalBilled, totalPaid, totalDue, periodText) => {
        if (!customerData.phone) {
            setToast({ type: 'error', title: 'Missing Phone', message: `Cannot send ledger. Customer ${customerData.customerName} does not have a phone number.` });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Confirm Send Ledger',
            message: `Generate and send the ledger PDF for the selected range to ${customerData.customerName} via WhatsApp?`,
            action: async () => {
                setLoadingStates(prev => ({ ...prev, [`ledger-${customerData.customerId}`]: true }));
                try {
                    const payload = {
                        phone: customerData.phone,
                        customerName: customerData.customerName,
                        totalBilled,
                        totalPaid,
                        totalDue,
                        transactions,
                        periodText
                    };

                    const response = await api.post('/whatsapp/send-ledger', payload);
                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.message || 'Failed to send ledger');
                    }
                    
                    setToast({ type: 'success', title: 'Ledger Sent', message: `Ledger sent to ${customerData.customerName} successfully.` });
                } catch (error) { 
                    setToast({ type: 'error', title: 'Error', message: `An error occurred: ${error.message}` });
                } finally { 
                    setLoadingStates(prev => ({ ...prev, [`ledger-${customerData.customerId}`]: false })); 
                }
            }
        });
    };

    // Payment Modal handlers
    const handleShowPaymentModal = (invoice) => { 
        setSelectedInvoice(invoice); 
        setShowPaymentModal(true); 
    };
    const handleHidePaymentModal = () => { 
        setSelectedInvoice(null); 
        setShowPaymentModal(false); 
    };
    const handleSavePayment = () => { 
        setDataVersion(v => v + 1); // Triggers background re-fetch and updates amounts!
    }; 

    // Delete / Clear Customer Account Handler
    const promptDeleteCustomer = (customerData) => {
        setCustomerToDelete(customerData);
        setDeleteConfirmText('');
        setShowDeleteCustomerModal(true);
    };

    const confirmDeleteCustomer = async () => {
        if (!customerToDelete || deleteConfirmText.toUpperCase() !== 'DELETE') return;
        
        setLoadingStates(prev => ({ ...prev, [`delete-${customerToDelete.customerId}`]: true }));
        try {
            const res = await api.delete(`/customers/${customerToDelete.customerId}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to delete customer record.');
            }
            setToast({ type: 'success', title: 'Customer account cleared', message: `${customerToDelete.customerName} and their associated records were removed.` });
            setShowDeleteCustomerModal(false);
            setCustomerToDelete(null);
            setDataVersion(v => v + 1);
        } catch (err) {
            setToast({ type: 'error', title: 'Could not clear account', message: err.message });
        } finally {
            setLoadingStates(prev => ({ ...prev, [`delete-${customerToDelete?.customerId}`]: false }));
        }
    };
    // --- Sub-Components ---
    const CustomerWiseView = () => (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                <span className="small text-muted fw-medium">
                    Showing <strong className="text-dark">{paginatedCustomers.length}</strong> of <strong className="text-dark">{customerWiseDues.length}</strong> Party Accounts
                </span>
                <div className="d-flex gap-2">
                    <Button variant="light" size="sm" onClick={handleExpandAll} className="px-3 fw-medium border shadow-sm text-secondary hover-primary">
                        <FaFolderOpen className="me-2"/> Expand All
                    </Button>
                    <Button variant="light" size="sm" onClick={handleCollapseAll} className="px-3 fw-medium border shadow-sm text-secondary hover-primary">
                        <FaFolder className="me-2"/> Collapse All
                    </Button>
                </div>
            </div>

            <Accordion 
              alwaysOpen 
              activeKey={expandedCustomerKeys} 
              onSelect={(keys) => setExpandedCustomerKeys(keys)}
              className="saas-accordion"
            >
                {paginatedCustomers.length === 0 ? (
                    <div className="text-center p-5 text-muted bg-white border border-light rounded-4 shadow-sm">
                        <FaInfoCircle size="2em" className="mb-3 text-secondary"/>
                        <h5 className="fw-bold text-dark">No Customers Found</h5>
                        <p>No matching accounts found for the current search/date filters.</p>
                    </div>
                ) : (
                    paginatedCustomers.map((customer) => (
                        <Accordion.Item key={customer.customerId} eventKey={String(customer.customerId)} className="mb-2 border-light rounded-3 shadow-sm overflow-hidden bg-white">
                            <Accordion.Header as="div" bsPrefix="custom-accordion-header">
                                <div className="d-flex w-100 justify-content-between align-items-center py-1 pe-3">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle me-3 ms-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                                            <FaUserCircle size="1.2em" />
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '13.5px' }}>{customer.customerName}</h6>
                                            <small className="text-secondary fw-medium" style={{ fontSize: '11.5px' }}>
                                                {customer.invoiceCount} Invoice(s) {customer.phone ? <span className="ms-2">📱 {customer.phone}</span> : ''}
                                            </small>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="text-end me-4">
                                            <small className="d-block text-secondary text-uppercase fw-bold" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Outstanding</small>
                                            <strong style={{ fontSize: '13.5px' }} className={customer.totalDue > 0 ? 'text-danger' : 'text-success'}>
                                                {formatCurrency(customer.totalDue)}
                                            </strong>
                                        </div>

                                        {/* Action Buttons */}
                                        <Button 
                                          variant="outline-secondary" 
                                          size="sm" 
                                          className="fw-medium px-3 border-light shadow-sm"
                                          onClick={(e) => { e.stopPropagation(); handleOpenStatementModal(customer); }}
                                        >
                                            <FaPrint className="me-2 text-muted" /> Statement
                                        </Button>

                                        {activeGarage?.feature_reminders && customer.totalDue > 0 && (
                                            <Button 
                                              variant="primary" 
                                              size="sm" 
                                              className="fw-medium px-3 shadow-sm"
                                              onClick={(e) => { e.stopPropagation(); handleRemindAllForCustomer(customer.customerId, customer.customerName); }} 
                                              disabled={loadingStates[`cust-${customer.customerId}`] || activeGarage?.feature_whatsapp_utility === false}
                                              title={activeGarage?.feature_whatsapp_utility === false ? "WhatsApp Utility messaging is disabled by Super Admin" : "Send payment reminders via WhatsApp"}
                                            >
                                                {loadingStates[`cust-${customer.customerId}`] ? <Spinner size="sm" /> : <><FaPaperPlane className="me-2"/> Remind</>}
                                            </Button>
                                        )}

                                        <Button 
                                          variant="light" 
                                          size="sm" 
                                          className="text-danger border shadow-sm px-2 hover-danger"
                                          title="Delete / Clear Customer Account"
                                          onClick={(e) => { e.stopPropagation(); promptDeleteCustomer(customer); }}
                                        >
                                            <FaTrashAlt />
                                        </Button>
                                    </div>
                                </div>
                            </Accordion.Header>
                            <Accordion.Body className="p-0 border-top border-light" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <Table hover responsive className="mb-0 saas-table align-middle" style={{ minWidth: '800px' }}>
                                    <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                        <tr>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold border-bottom-0">Invoice Number</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold border-bottom-0">Date Issued</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold border-bottom-0">Due Date</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end border-bottom-0">Total Billed</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end border-bottom-0">Amount Paid</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end border-bottom-0">Amount Due</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-center border-bottom-0">Status</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-center border-bottom-0" style={{ width: '150px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customer.invoices.map(inv => (
                                            <tr key={inv.id} className="border-bottom border-light">
                                                <td className="fw-bold px-4"><Link to={`/invoices/${inv.id}/view`} className="text-dark text-decoration-none hover-primary">{inv.invoiceNumber}</Link></td>
                                                <td className="px-4 text-secondary">{formatDate(inv.dateIssued)}</td>
                                                <td className="px-4 text-secondary">{formatDate(inv.dueDate)}</td>
                                                <td className="px-4 text-end fw-semibold text-dark">{formatCurrency(inv.grandTotal)}</td>
                                                <td className="px-4 text-end text-success fw-medium">{formatCurrency(inv.amountPaid)}</td>
                                                <td className="px-4 text-end fw-bold text-danger">{formatCurrency(inv.amountDue)}</td>
                                                <td className="px-4 text-center">
                                                    <span className={`saas-badge ${inv.status === 'Paid' ? 'saas-badge-success' : inv.status === 'Overdue' ? 'saas-badge-danger' : 'saas-badge-warning'}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 text-center">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Record / Edit Payments</Tooltip>}>
                                                            <button className="btn btn-link text-success p-0 border-0 hover-success" onClick={() => handleShowPaymentModal(inv)}>
                                                                <FaMoneyBillWave size={18} />
                                                            </button>
                                                        </OverlayTrigger>

                                                        {activeGarage?.feature_reminders && inv.amountDue > 0 && (
                                                            <OverlayTrigger placement="top" overlay={<Tooltip>{activeGarage?.feature_whatsapp_utility === false ? "WhatsApp utility messaging is disabled by Super Admin." : "Send WhatsApp Reminder"}</Tooltip>}>
                                                                <button className="btn btn-link text-primary p-0 border-0 hover-primary" onClick={() => handleSendSingleReminder(inv)} disabled={loadingStates[inv.id] || activeGarage?.feature_whatsapp_utility === false}>
                                                                    {loadingStates[inv.id] ? <Spinner size="sm" /> : <FaPaperPlane size={18} />}
                                                                </button>
                                                            </OverlayTrigger>
                                                        )}

                                                        <OverlayTrigger placement="top" overlay={<Tooltip>View Detailed Invoice</Tooltip>}>
                                                            <Link to={`/invoices/${inv.id}/view`} className="btn btn-link text-secondary p-0 border-0 hover-primary">
                                                                <FaListUl size={18} />
                                                            </Link>
                                                        </OverlayTrigger>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))
                )}
            </Accordion>
        </div>
    );

    const InvoiceWiseView = () => (
         <div className="saas-table-wrapper shadow-sm bg-white rounded-4 overflow-hidden border border-light">
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <Table hover responsive className="mb-0 saas-table align-middle" style={{ minWidth: '1000px' }}>
                    <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                        <tr>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold border-bottom-0">Invoice Number</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold border-bottom-0">Customer Name</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold border-bottom-0">Phone</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold border-bottom-0">Vehicle Number</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold border-bottom-0">Due Date</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end border-bottom-0">Total Billed</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end border-bottom-0">Amount Paid</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end border-bottom-0">Amount Due</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-center border-bottom-0">Status</th>
                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-center border-bottom-0" style={{ width: '150px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedInvoices.length === 0 ? (
                            <tr><td colSpan="10" className="text-center py-5 text-muted"><FaInfoCircle className="me-2"/> No matching invoices found.</td></tr>
                        ) : (
                            paginatedInvoices.map(inv => (
                                <tr key={inv.id} className="border-bottom border-light">
                                    <td className="px-4 fw-bold"><Link to={`/invoices/${inv.id}/view`} className="text-dark text-decoration-none hover-primary">{inv.invoiceNumber}</Link></td>
                                    <td className="px-4 fw-medium text-dark">{inv.customerName}</td>
                                    <td className="px-4 text-secondary">{inv.customerPhone || 'N/A'}</td>
                                    <td className="px-4 text-secondary">{inv.vehicleNumber}</td>
                                    <td className="px-4 text-secondary">{formatDate(inv.dueDate)}</td>
                                    <td className="px-4 text-end fw-semibold text-dark">{formatCurrency(inv.grandTotal)}</td>
                                    <td className="px-4 text-end text-success fw-medium">{formatCurrency(inv.amountPaid)}</td>
                                    <td className="px-4 text-end fw-bold text-danger">{formatCurrency(inv.amountDue)}</td>
                                    <td className="px-4 text-center">
                                        <span className={`saas-badge ${inv.status === 'Paid' ? 'saas-badge-success' : inv.status === 'Overdue' ? 'saas-badge-danger' : 'saas-badge-warning'}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-4 text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Record / Edit Payments</Tooltip>}>
                                                <button className="btn btn-link text-success p-0 border-0 hover-success" onClick={() => handleShowPaymentModal(inv)}>
                                                    <FaMoneyBillWave size={18} />
                                                </button>
                                            </OverlayTrigger>
                                            
                                            {activeGarage?.feature_reminders && inv.amountDue > 0 && (
                                                <OverlayTrigger placement="top" overlay={<Tooltip>{activeGarage?.feature_whatsapp_utility === false ? "WhatsApp utility messaging is disabled by Super Admin." : "Send WhatsApp Reminder"}</Tooltip>}>
                                                    <button className="btn btn-link text-primary p-0 border-0 hover-primary" onClick={() => handleSendSingleReminder(inv)} disabled={loadingStates[inv.id] || activeGarage?.feature_whatsapp_utility === false}>
                                                        {loadingStates[inv.id] ? <Spinner size="sm" /> : <FaPaperPlane size={18} />}
                                                    </button>
                                                </OverlayTrigger>
                                            )}

                                            <OverlayTrigger placement="top" overlay={<Tooltip>View Detailed Invoice</Tooltip>}>
                                                <Link to={`/invoices/${inv.id}/view`} className="btn btn-link text-secondary p-0 border-0 hover-primary">
                                                    <FaListUl size={18} />
                                                </Link>
                                            </OverlayTrigger>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );

    // --- Main Render ---
    if (isLoading && invoices.length === 0) {
        return (
            <Container fluid className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-3">Loading account ledgers...</p>
            </Container>
        );
    }

    return (
        <PageShell
            title="Party Accounts & Receivables"
            subtitle="Manage customer balances, view transaction histories, print account statements, and collect payments."
            icon={FaFileInvoiceDollar}
            actions={
                <div className="d-flex gap-2 align-items-center">
                    <Button variant="outline-success" className="btn-saas btn-saas-secondary" style={{ height: '38px' }} onClick={handleExportCSV}>
                        <FaFileDownload className="me-2" /> Export Report
                    </Button>
                    <div className="bg-light p-1 rounded-3 border border-light d-flex shadow-sm" style={{ height: '38px', alignItems: 'center' }}>
                        <button 
                            type="button"
                            className={`btn btn-sm rounded-2 px-3 fw-medium border-0 py-1 ${viewMode === 'customer' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary hover-bg-white'}`}
                            onClick={() => { setViewMode('customer'); setCurrentPage(1); }}
                            style={{ fontSize: '12px' }}
                        >
                            <FaUsers className="me-1"/> Party View
                        </button>
                        <button 
                            type="button"
                            className={`btn btn-sm rounded-2 px-3 fw-medium border-0 py-1 ${viewMode === 'invoice' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary hover-bg-white'}`}
                            onClick={() => { setViewMode('invoice'); setCurrentPage(1); }}
                            style={{ fontSize: '12px' }}
                        >
                            <FaListUl className="me-1"/> Invoice View
                        </button>
                    </div>
                </div>
            }
        >
            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                title={confirmModal.title} 
                message={confirmModal.message} 
                onConfirm={() => { confirmModal.action(); setConfirmModal({ ...confirmModal, isOpen: false }); }} 
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
            />

            <div className="main-content pt-0">
                {fetchError && <Alert variant="danger" className="shadow-sm mb-4" onClose={() => setFetchError('')} dismissible>{fetchError}</Alert>}
                {activeGarage?.feature_whatsapp_utility === false && (
                    <Alert variant="warning" className="border-0 shadow-sm rounded-3 mb-4 d-flex align-items-center">
                        <FaExclamationCircle className="fs-3 me-3 text-warning flex-shrink-0" />
                        <div>
                            <strong>WhatsApp Reminders Disabled</strong>: Your Super Admin has disabled transactional utility messaging. Sending payment statements and reminders via WhatsApp is currently locked.
                        </div>
                    </Alert>
                )}
                {toast && <CustomToast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

                {/* KPI Cards */}
                <div className="stat-card-grid mb-4">
                    <StatCard 
                        icon={FaFileInvoiceDollar} 
                        label="Total Billed" 
                        value={formatCurrency(kpi.totalBilled)} 
                        subtext={`${kpi.totalInvoicesCount} Total Invoices`}
                        iconColor="indigo" 
                    />
                    <StatCard 
                        icon={FaMoneyBillWave} 
                        label="Total Collected" 
                        value={formatCurrency(kpi.totalCollected)} 
                        subtext="Received Payments"
                        iconColor="emerald" 
                    />
                    <StatCard 
                        icon={FaClock} 
                        label="Total Outstanding" 
                        value={formatCurrency(kpi.totalOutstanding)} 
                        subtext={`${kpi.pendingCount} Pending Bills`}
                        iconColor="indigo" 
                    />
                    <StatCard 
                        icon={FaExclamationCircle} 
                        label="Amount Overdue" 
                        value={formatCurrency(kpi.totalOverdue)} 
                        subtext="Action Required"
                        iconColor="rose" 
                    />
                </div>

                {/* Filters */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search Customer, Vehicle, Invoice #..."
                >
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Form.Control
                            type="date"
                            className="form-control-saas"
                            style={{ width: '135px', height: '38px', fontSize: '13px' }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            title="Start Date"
                        />
                        <span className="text-muted small">to</span>
                        <Form.Control
                            type="date"
                            className="form-control-saas"
                            style={{ width: '135px', height: '38px', fontSize: '13px' }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            title="End Date"
                        />
                    </div>

                    <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select-saas"
                        style={{ width: '150px' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                    </Form.Select>
                </FilterBar>

                {/* Main Views */}
                {viewMode === 'customer' ? <CustomerWiseView /> : <InvoiceWiseView />}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                        <Pagination className="shadow-sm">
                            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
                            
                            {[...Array(totalPages)].map((_, idx) => {
                                const page = idx + 1;
                                // Show first, last, and pages around current
                                if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                                    return (
                                        <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                                            {page}
                                        </Pagination.Item>
                                    );
                                } else if (page === currentPage - 3 || page === currentPage + 3) {
                                    return <Pagination.Ellipsis key={page} disabled />;
                                }
                                return null;
                            })}

                            <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}
            {selectedInvoice && (
                <RecordPaymentModal 
                    show={showPaymentModal} 
                    onHide={handleHidePaymentModal} 
                    invoice={selectedInvoice} 
                    onPaymentActionSuccess={handleSavePayment} 
                />
            )}

            {selectedCustomerForStatement && (
                <CustomerStatementModal 
                    show={showStatementModal} 
                    onHide={() => setShowStatementModal(false)} 
                    customer={selectedCustomerForStatement} 
                    garageProfile={garageProfile} 
                    onSendWhatsApp={handleSendLedgerWhatsApp}
                    loadingWhatsApp={loadingStates[`ledger-${selectedCustomerForStatement.customerId}`]}
                />
            )}

            {/* Clear Customer Account Modal */}
            <Modal show={showDeleteCustomerModal} onHide={() => setShowDeleteCustomerModal(false)} backdrop="static" centered className="saas-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="h5 fw-bold text-danger"><FaShieldAlt className="me-2"/>Clear Customer Account</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <Alert variant="danger" className="bg-danger bg-opacity-10 border-0 text-danger shadow-sm">
                        <FaExclamationCircle className="me-2" />
                        <strong>Warning: High-Risk Action</strong><br/>
                        You are about to delete the customer <strong>{customerToDelete?.customerName}</strong> and ALL associated Invoices and Job Sheets.
                    </Alert>
                    <p className="text-secondary small mt-3">
                        This action will permanently wipe their history from the database. This cannot be undone. To proceed, please type <strong>DELETE</strong> below.
                    </p>
                    <Form.Control
                        type="text"
                        placeholder="Type DELETE to confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="mt-3 border-danger shadow-none bg-light"
                    />
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={() => setShowDeleteCustomerModal(false)} disabled={loadingStates[`delete-${customerToDelete?.customerId}`]}>Cancel</Button>
                    <Button 
                        variant="danger" 
                        onClick={confirmDeleteCustomer} 
                        disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || loadingStates[`delete-${customerToDelete?.customerId}`]}
                        className="px-4"
                    >
                        {loadingStates[`delete-${customerToDelete?.customerId}`] ? <Spinner size="sm" /> : 'Confirm Wipe'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </PageShell>
    );
};

export default AccountsReceivablePage;
