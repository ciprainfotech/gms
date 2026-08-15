import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Container, Card, Row, Col, Table, Button, Form, Badge } from 'react-bootstrap';
import { 
  FaUsers, FaUserPlus, FaCalendarCheck, FaMoneyBillWave, FaTrash, 
  FaEdit, FaWhatsapp, FaCalendarAlt, FaHistory, FaCheckCircle, 
  FaTimes, FaFileInvoiceDollar, FaEye, FaEyeSlash, FaSave, FaChartLine, FaPrint,
  FaUserSlash, FaUserCheck, FaExclamationTriangle, FaLock
} from 'react-icons/fa';
import api, { API_BASE_URL } from '../api/api.js';
import CustomToast from '../components/CustomToast';
import LoadingOverlay from '../components/LoadingOverlay';
import ConfirmModal from '../components/ConfirmModal';
import { useGarage } from '../contexts/GarageContext';

const PayrollPage = () => {
  const outletContext = useOutletContext();
  const { features } = useGarage();
  const activeGarage = outletContext?.activeGarage;
  const isSuspended = activeGarage?.is_active === false;

  // Global Page states
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });
  
  // Data arrays
  const [staffList, setStaffList] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'attendance' | 'accounts' | 'reports'

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  
  // Month Ledger Book states
  const [ledgerBookState, setLedgerBookState] = useState({}); // { [staffId]: { [day]: status } }
  const [hasAttendanceChanges, setHasAttendanceChanges] = useState(false);

  // Privacy toggles
  const [showSalaries, setShowSalaries] = useState({}); // { [staffId]: boolean }

  // Modals & form state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({ 
    name: '', 
    phone: '', 
    role: 'Mechanic', 
    salary_type: 'monthly', 
    base_salary: 0,
    joined_date: new Date().toISOString().split('T')[0]
  });

  const [showTxModal, setShowTxModal] = useState(false);
  const [txStaff, setTxStaff] = useState(null);
  const [txForm, setTxForm] = useState({ 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    payment_method: 'Cash', 
    notes: '',
    send_whatsapp: true
  });

  const [ledgerStaff, setLedgerStaff] = useState(null);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Resign modal
  const [showResignModal, setShowResignModal] = useState(false);
  const [resigningStaff, setResigningStaff] = useState(null);
  const [resignForm, setResignForm] = useState({ leaving_date: new Date().toISOString().split('T')[0], leaving_notes: '', status: 'resigned' });

  // Ledger filter toggle
  const [showResignedInLedger, setShowResignedInLedger] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchMonthlyLedgerDetails();
    } else if (activeTab === 'accounts' || activeTab === 'reports') {
      fetchMonthlySummary();
    }
  }, [activeTab, selectedMonth, staffList]);

  // --- API CALLS ---
  
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      } else {
        setToast({ type: 'error', title: 'Fetch Error', message: 'Failed to retrieve employee directory.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Network Error', message: 'Unable to connect to database service.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/staff/attendance/summary?month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlySummary(data.summary || []);
      } else {
        setToast({ type: 'error', title: 'Error', message: 'Failed to retrieve payroll summary.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Network error retrieving payroll calculations.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyLedgerDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/staff/attendance/month?month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        const logs = data.logs || [];
        
        // Build map: { [staff_id]: { [YYYY-MM-DD]: status } }
        const map = {};
        staffList.forEach(s => {
          map[s.id] = {};
        });
        
        logs.forEach(log => {
          if (!map[log.staff_id]) map[log.staff_id] = {};
          const cleanDateStr = log.date ? log.date.toString().split('T')[0] : '';
          if (cleanDateStr) {
            map[log.staff_id][cleanDateStr] = log.status;
          }
        });

        setLedgerBookState(map);
        setHasAttendanceChanges(false);
      } else {
        setToast({ type: 'error', title: 'Error', message: 'Failed to load ledger registry logs.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Network error fetching ledger book.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.role.trim()) {
      setToast({ type: 'error', title: 'Validation Failed', message: 'Name and Role are required fields.' });
      return;
    }

    setProcessing(true);
    try {
      const endpoint = editingStaff ? `/staff/${editingStaff.id}` : '/staff';
      const method = editingStaff ? 'PUT' : 'POST';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'Saved successfully', message: data.message });
        setShowStaffModal(false);
        setEditingStaff(null);
        fetchStaff();
      } else {
        setToast({ type: 'error', title: 'Save Failed', message: data.message || 'Error occurred.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Network Error', message: 'Failed to connect to backend server.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      phone: staff.phone || '',
      role: staff.role,
      salary_type: staff.salary_type || 'monthly',
      base_salary: staff.base_salary || 0,
      joined_date: staff.joined_date ? staff.joined_date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowStaffModal(true);
  };

  const handleDeleteStaff = (staff) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Staff Member',
      message: `Are you sure you want to permanently delete "${staff.name}"? This will clear all attendance logs and payment history.`,
      action: async () => {
        setProcessing(true);
        try {
          const res = await fetch(`${API_BASE_URL}/staff/${staff.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const data = await res.json();
          if (res.ok) {
            setToast({ type: 'success', title: 'Employee Deleted', message: data.message });
            fetchStaff();
          } else {
            setToast({ type: 'error', title: 'Delete Failed', message: data.message });
          }
        } catch (err) {
          setToast({ type: 'error', title: 'Error', message: 'Server communication failed.' });
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  // --- LEDGER REGISTER ATTENDANCE mark cycle ---

  const handleOpenResignModal = (staff) => {
    setResigningStaff(staff);
    setResignForm({
      leaving_date: new Date().toISOString().split('T')[0],
      leaving_notes: '',
      status: 'resigned'
    });
    setShowResignModal(true);
  };

  const handleResignStaff = async (e) => {
    e.preventDefault();
    if (!resignForm.leaving_date) {
      setToast({ type: 'error', title: 'Validation', message: 'Leaving date is required.' });
      return;
    }
    // Client side: leaving_date must be >= joined_date
    const joinedDate = resigningStaff.joined_date?.split('T')[0];
    if (joinedDate && resignForm.leaving_date < joinedDate) {
      setToast({ type: 'error', title: 'Invalid Date', message: `Leaving date cannot be before joining date (${new Date(joinedDate).toLocaleDateString('en-IN')}).` });
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${resigningStaff.id}/resign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resignForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'Status Updated', message: data.message });
        setShowResignModal(false);
        setResigningStaff(null);
        fetchStaff();
      } else {
        setToast({ type: 'error', title: 'Failed', message: data.message });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Network Error', message: 'Could not connect to server.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateStaff = (staff) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reactivate Staff Member',
      message: `Reactivate ${staff.name} as an active employee? Their leaving date will be cleared.`,
      action: async () => {
        setProcessing(true);
        try {
          const res = await fetch(`${API_BASE_URL}/staff/${staff.id}/reactivate`, {
            method: 'PATCH',
            credentials: 'include'
          });
          const data = await res.json();
          if (res.ok) {
            setToast({ type: 'success', title: 'Reactivated!', message: data.message });
            fetchStaff();
          } else {
            setToast({ type: 'error', title: 'Failed', message: data.message });
          }
        } catch (err) {
          setToast({ type: 'error', title: 'Error', message: 'Server communication failed.' });
        } finally {
          setProcessing(false);
        }
      }
    });
  };


  const daysInActiveMonth = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalDays = new Date(year, month, 0).getDate();
    
    const list = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const dateObj = new Date(year, month - 1, d);
      const dayName = dayNames[dateObj.getDay()];
      const isSunday = dateObj.getDay() === 0;
      const dateStr = `${selectedMonth}-${dayStr}`;
      list.push({ day: d, dayName, isSunday, dateStr });
    }
    return list;
  }, [selectedMonth]);

  const handleCellStatusSelect = (staffId, dateStr, nextStatus) => {
    setLedgerBookState(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [dateStr]: nextStatus || null
      }
    }));
    setHasAttendanceChanges(true);
  };

  const handleSaveLedgerBook = async () => {
    setProcessing(true);
    setProgressMsg('Saving attendance register book...');
    try {
      const attendanceList = [];
      
      Object.keys(ledgerBookState).forEach(staffId => {
        const datesMap = ledgerBookState[staffId] || {};
        Object.keys(datesMap).forEach(dateStr => {
          const status = datesMap[dateStr];
          if (status) {
            attendanceList.push({
              staff_id: parseInt(staffId, 10),
              date: dateStr,
              status
            });
          }
        });
      });

      const res = await fetch(`${API_BASE_URL}/staff/attendance/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: daysInActiveMonth[0].dateStr, attendanceList }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'Ledger Saved', message: 'Monthly attendance register saved successfully!' });
        fetchMonthlyLedgerDetails();
      } else {
        setToast({ type: 'error', title: 'Save Failed', message: data.message });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Could not connect to database.' });
    } finally {
      setProcessing(false);
      setProgressMsg('');
    }
  };

  // --- SINGLE UNIFIED PAY STAFF TRANSACTION ---

  const handleOpenPayModal = (staff) => {
    setTxStaff(staff);
    
    // Find dynamic pending balance for this staff
    const staffCalculated = calculatedPayrollData.find(c => Number(c.id) === Number(staff.id));
    const pendingAmount = staffCalculated ? Math.round(staffCalculated.pendingSalary) : 0;

    setTxForm({
      amount: pendingAmount > 0 ? pendingAmount.toString() : '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      notes: '',
      send_whatsapp: Boolean(activeGarage?.whatsapp_phone_number_id)
    });
    setShowTxModal(true);
  };

  const handlePayStaffSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) {
      setToast({ type: 'error', title: 'Validation Error', message: 'Amount must be greater than zero.' });
      return;
    }

    setProcessing(true);
    try {
      const amountVal = parseFloat(txForm.amount);
      
      // Validation: Joined date & Leaving date check
      if (txStaff.joined_date) {
        const joinDateStr = txStaff.joined_date.split('T')[0];
        if (txForm.date < joinDateStr) {
          setToast({
            type: 'error',
            title: 'Invalid Date',
            message: `Transaction date cannot be before joining date (${new Date(joinDateStr + 'T00:00:00').toLocaleDateString('en-IN')})!`
          });
          return;
        }
      }
      if (txStaff.leaving_date) {
        const leaveDateStr = txStaff.leaving_date.split('T')[0];
        if (txForm.date > leaveDateStr) {
          setToast({
            type: 'error',
            title: 'Invalid Date',
            message: `Transaction date cannot be after resignation date (${new Date(leaveDateStr + 'T00:00:00').toLocaleDateString('en-IN')})!`
          });
          return;
        }
      }

      const staffCalculated = calculatedPayrollData.find(c => Number(c.id) === Number(txStaff.id));
      const pendingSalary = staffCalculated ? staffCalculated.pendingSalary : 0;
      
      const txType = amountVal > pendingSalary ? 'Advance' : 'Payment';

      const payload = {
        staff_id: txStaff.id,
        type: txType,
        amount: amountVal,
        date: txForm.date,
        payment_method: txForm.payment_method,
        notes: txForm.notes,
        send_whatsapp: txForm.send_whatsapp,
        month: selectedMonth
      };

      const res = await fetch(`${API_BASE_URL}/staff/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'Payment Saved', message: 'Staff payment transaction logged successfully!' });
        setShowTxModal(false);
        fetchMonthlySummary(); // Refresh stats immediately
      } else {
        setToast({ type: 'error', title: 'Transaction Failed', message: data.message });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Failed to save transaction.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewLedger = async (staff) => {
    setLedgerStaff(staff);
    setProcessing(true);
    try {
      const res = await api.get(`/staff/${staff.id}/ledger`);
      if (res.ok) {
        const data = await res.json();
        setLedgerTransactions(data.transactions || []);
        setShowLedgerModal(true);
      } else {
        setToast({ type: 'error', title: 'Ledger Error', message: 'Failed to retrieve ledger.' });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Network Error', message: 'Unable to connect to database.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Rollback Transaction',
      message: 'Are you sure you want to rollback and delete this transaction record? This will adjust the ledger balance.',
      action: async () => {
        setProcessing(true);
        try {
          const res = await fetch(`${API_BASE_URL}/staff/transaction/${txId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const data = await res.json();
          if (res.ok) {
            setToast({ type: 'success', title: 'Transaction Deleted', message: data.message });
            // Refresh ledger
            if (ledgerStaff) {
              const freshLedger = await api.get(`/staff/${ledgerStaff.id}/ledger`);
              if (freshLedger.ok) {
                const flData = await freshLedger.json();
                setLedgerTransactions(flData.transactions || []);
              }
            }
            fetchMonthlySummary();
          } else {
            setToast({ type: 'error', title: 'Delete Failed', message: data.message });
          }
        } catch (err) {
          setToast({ type: 'error', title: 'Error', message: 'Failed to delete transaction.' });
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  // --- WHATSAPP STATEMENT SUMMARY DISPATCH ---

  const handleSendWhatsAppSummary = async (staff) => {
    if (!activeGarage) {
      setToast({ type: 'error', title: 'Error', message: 'Garage workspace profile not loaded yet.' });
      return;
    }
    if (!activeGarage.feature_whatsapp) {
      setToast({ type: 'error', title: 'Feature Disabled', message: 'WhatsApp Messaging is disabled globally for your account.' });
      return;
    }
    if (activeGarage.feature_whatsapp_utility === false) {
      setToast({ type: 'error', title: 'Feature Disabled', message: 'Utility messaging is disabled for your account by your Super Admin.' });
      return;
    }
    if (!activeGarage.whatsapp_phone_number_id) {
      setToast({ type: 'error', title: 'WhatsApp Not Configured', message: 'Meta WhatsApp Phone Number ID is not configured for your garage. Contact Super Admin.' });
      return;
    }
    if (!staff.phone) {
      setToast({ type: 'error', title: 'Missing Phone', message: `Cannot send summary. Staff ${staff.name} does not have a phone number.` });
      return;
    }

    setProcessing(true);
    setProgressMsg(`Sending account statement summary to ${staff.name}...`);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${staff.id}/send-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', title: 'WhatsApp Delivered', message: data.message });
      } else {
        setToast({ type: 'error', title: 'Dispatch Failed', message: data.message });
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Network Error', message: 'Could not connect to WhatsApp gateway service.' });
    } finally {
      setProcessing(false);
      setProgressMsg('');
    }
  };

  // --- PRINT PAYROLL REGISTER REPORT SHEET ---
  const handlePrintPayrollReport = () => {
    const printEl = document.getElementById('payroll-print-region');
    if (!printEl) {
      setToast({ type: 'error', title: 'Print Error', message: 'Report area not found. Switch to Monthly Reports tab first.' });
      return;
    }

    // Create a hidden iframe and inject only the report HTML
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Payroll Report - ${activeGarage?.name || 'Garage'}</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #000; background: #fff; margin: 0; padding: 0; }
            h3 { font-size: 20px; font-weight: 700; margin: 0 0 4px 0; color: #1e293b; }
            h5 { font-size: 14px; font-weight: 400; margin: 0; color: #64748b; }
            h6 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin: 0 0 4px 0; }
            .header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
            .text-end { text-align: right; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            thead tr { background: #f8fafc; }
            th { border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #475569; }
            td { border: 1px solid #e2e8f0; padding: 7px 8px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-success { color: #16a34a; }
            .text-danger { color: #dc2626; }
            .text-warning { color: #d97706; }
            .fw-bold { font-weight: 700; }
            .footer-row { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
            .footer-note { font-size: 10px; color: #94a3b8; }
            .signatory { font-size: 13px; font-weight: 700; color: #1e293b; }
          </style>
        </head>
        <body>
          ${printEl.innerHTML}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:14px;border-top:1px solid #e2e8f0;">
            <div style="font-size:10px;color:#94a3b8;">
              Generated by Garage Workshop Payroll Suite &bull; ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style="font-size:13px;font-weight:700;color:#1e293b;">
              Authorized Signatory: _______________________
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  // ── Lifecycle helpers ──────────────────────────────────────────────────────

  // Is this staff member employed at any point during the selected month?
  const isStaffActiveInMonth = (staff, yearN, monthN) => {
    const firstDay = `${selectedMonth}-01`;
    const lastDayDate = new Date(yearN, monthN, 0);
    const lastDay = lastDayDate.toISOString().split('T')[0];
    const joinedDate = staff.joined_date?.split('T')[0];
    const leavingDate = staff.leaving_date?.split('T')[0];
    if (!joinedDate) return false;
    if (joinedDate > lastDay) return false;
    if (leavingDate && leavingDate < firstDay) return false;
    return true;
  };

  // Should this cell (dateStr = YYYY-MM-DD) be disabled for this staff?
  // Returns { disabled: bool, reason: string }
  const getCellState = (staff, dateStr) => {
    const joinedDate = staff.joined_date?.split('T')[0];
    const leavingDate = staff.leaving_date?.split('T')[0];
    if (joinedDate && dateStr < joinedDate) {
      return { disabled: true, reason: `Before joining (${new Date(joinedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})` };
    }
    if (leavingDate && dateStr > leavingDate) {
      return { disabled: true, reason: `After leaving (${new Date(leavingDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})` };
    }
    return { disabled: false, reason: null };
  };

  // --- DYNAMIC CALCULATIONS ---

  const calculatedPayrollData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const firstDay = `${selectedMonth}-01`;
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

    // Filter: only staff active during this month OR resigned staff with pending balance
    return staffList
      .filter(staff => {
        const activeThisMonth = isStaffActiveInMonth(staff, year, month);
        if (activeThisMonth) return true;
        // Always include resigned staff with pending balance for accounts settlement
        const sum = monthlySummary.find(item => Number(item.staff_id) === Number(staff.id));
        // If not in this month's summary but resigned, they may still have all-time dues — show them
        return staff.status !== 'active';
      })
      .map(staff => {
        const sum = monthlySummary.find(item => Number(item.staff_id) === Number(staff.id)) || {
          present_count: 0, half_day_count: 0, holiday_count: 0, absent_count: 0, total_paid: 0
        };

        const present = parseInt(sum.present_count || 0, 10);
        const halfDay = parseInt(sum.half_day_count || 0, 10);
        const holiday = parseInt(sum.holiday_count || 0, 10);
        const absent = parseInt(sum.absent_count || 0, 10);

        // Paid days
        const paidDays = present + holiday + (0.5 * halfDay);
        const baseSalary = parseFloat(staff.base_salary || 0);

        // Proration: for partial months, denominator = days staff was active in this month
        const joinedDate = staff.joined_date?.split('T')[0];
        const leavingDate = staff.leaving_date?.split('T')[0];
        const effectiveStart = joinedDate && joinedDate > firstDay ? joinedDate : firstDay;
        const effectiveEnd = leavingDate && leavingDate < lastDay ? leavingDate : lastDay;

        const effectiveStartObj = new Date(effectiveStart + 'T00:00:00');
        const effectiveEndObj = new Date(effectiveEnd + 'T00:00:00');
        const activeDaysInMonth = Math.max(1, Math.round((effectiveEndObj - effectiveStartObj) / (1000 * 60 * 60 * 24)) + 1);

        let earnedSalary = 0;
        if (staff.salary_type === 'daily') {
          earnedSalary = baseSalary * paidDays;
        } else {
          // Prorate: use actual active days in month as denominator
          earnedSalary = (baseSalary / activeDaysInMonth) * paidDays;
        }

        const totalPaid = parseFloat(sum.total_paid || 0);
        const pendingSalary = earnedSalary - totalPaid;

        return {
          ...staff,
          attendanceSummary: { present, halfDay, holiday, absent, paidDays },
          earnedSalary,
          totalDaysInMonth,
          activeDaysInMonth,
          totalPaid,
          pendingSalary,
          isActiveThisMonth: isStaffActiveInMonth(staff, year, month)
        };
      });
  }, [staffList, monthlySummary, selectedMonth]);

  // Analytics helper metrics
  const analyticsData = useMemo(() => {
    if (calculatedPayrollData.length === 0) return { avgAttendance: 0, totalLiability: 0, totalPaid: 0, totalPending: 0 };
    
    let totalPresentDays = 0;
    let totalPossibleDays = 0;
    let liability = 0;
    let paid = 0;
    let pending = 0;

    calculatedPayrollData.forEach(s => {
      totalPresentDays += s.attendanceSummary.present + (0.5 * s.attendanceSummary.halfDay) + s.attendanceSummary.holiday;
      totalPossibleDays += s.totalDaysInMonth;
      liability += s.earnedSalary;
      paid += s.totalPaid;
      pending += s.pendingSalary;
    });

    const avgAttendance = totalPossibleDays > 0 ? (totalPresentDays / totalPossibleDays) * 100 : 0;
    return {
      avgAttendance,
      totalLiability: Math.round(liability),
      totalPaid: Math.round(paid),
      totalPending: Math.round(pending)
    };
  }, [calculatedPayrollData]);

  const initials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDateSafe = (dateVal) => {
    if (!dateVal) return '—';
    const cleanStr = dateVal.toString().split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return cleanStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const toggleSalaryVisibility = (staffId) => {
    setShowSalaries(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  return (
    <Container fluid className="py-4">
      <LoadingOverlay isVisible={loading || processing} message={progressMsg || 'Loading staff records...'} />
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

      {/* PAGE HEADER */}
      <div className="page-header-row mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center">
        <div>
          <h2 className="page-title-active mb-1">
            <FaUsers className="me-2 text-primary" /> Staff & Payroll
          </h2>
          <p className="text-muted mb-0 small">
            Manage your workshop staff records, manual attendance logs, advances ledger, and WhatsApp payment notifications.
          </p>
        </div>
        {!isSuspended && features.payroll ? (
          <Button 
            variant="primary" 
            className="btn btn-primary mt-3 mt-md-0 d-inline-flex align-items-center" 
            onClick={() => {
              setEditingStaff(null);
              setStaffForm({ 
                name: '', 
                phone: '', 
                role: 'Mechanic', 
                salary_type: 'monthly', 
                base_salary: 0, 
                joined_date: new Date().toISOString().split('T')[0] 
              });
              setShowStaffModal(true);
            }}
          >
            <FaUserPlus className="me-2" /> Add Staff Member
          </Button>
        ) : (!features.payroll) ? (
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center mt-3 mt-md-0" style={{ fontSize: '13px' }}>
            <FaLock className="me-1.5" /> Read-Only Mode (Locked by Admin)
          </span>
        ) : null}
      </div>

      {!features.payroll && (
        <Alert variant="warning" className="d-flex align-items-center mb-4 shadow-sm border-0 rounded-3" style={{ backgroundColor: '#fffbe6', borderLeft: '4px solid #f59e0b' }}>
          <FaLock className="fs-4 me-3 text-warning flex-shrink-0" />
          <div>
            <strong className="d-block text-dark fw-bold">Module Locked in Read-Only Mode</strong>
            <span className="small text-muted">You can browse past staff directory records, attendance logs, and payroll balances in Read-Only Mode. Adding new staff, modifying records, or issuing payouts is locked by Super Admin.</span>
          </div>
        </Alert>
      )}

      {/* SEGMENTED TAB NAVIGATION CONTROL (HIGH-END DESIGN) */}
      <div className="d-flex justify-content-center mb-4">
        <div className="saas-segmented-control">
          <button 
            className={activeTab === 'directory' ? 'active' : ''} 
            onClick={() => setActiveTab('directory')}
          >
            Staff Directory
          </button>
          <button 
            className={activeTab === 'attendance' ? 'active' : ''} 
            onClick={() => setActiveTab('attendance')}
          >
            Monthly Ledger Register
          </button>
          <button 
            className={activeTab === 'accounts' ? 'active' : ''} 
            onClick={() => setActiveTab('accounts')}
          >
            Payroll & Accounts
          </button>
          <button 
            className={activeTab === 'reports' ? 'active' : ''} 
            onClick={() => setActiveTab('reports')}
          >
            Monthly Reports & Sheets
          </button>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          
          {/* TAB 1: STAFF DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="table-responsive">
              <Table className="saas-table align-middle">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Left Date</th>
                    <th>Base Rate</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No employee records found. Click "Add Staff Member" to get started.
                      </td>
                    </tr>
                  ) : (
                    staffList.map((staff) => {
                      const isActive = !staff.status || staff.status === 'active';
                      const isResigned = staff.status === 'resigned';
                      const isTerminated = staff.status === 'terminated';
                      return (
                        <tr key={staff.id} style={{ opacity: isActive ? 1 : 0.72 }}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                style={{
                                  width: '38px', height: '38px', fontSize: '13px',
                                  background: isActive
                                    ? 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)'
                                    : isResigned
                                    ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                                    : 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)'
                                }}
                              >
                                {initials(staff.name)}
                              </div>
                              <div>
                                <strong className="text-dark d-block">{staff.name}</strong>
                                <span className="text-muted text-xs">{staff.role}</span>
                              </div>
                            </div>
                          </td>
                          <td className="small">{staff.phone || <span className="text-muted">—</span>}</td>
                          <td>
                            <Badge
                              bg="primary"
                              className="bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1"
                              style={{ fontSize: '11px', borderRadius: '20px' }}
                            >
                              {staff.role}
                            </Badge>
                          </td>
                          <td>
                            {isActive && (
                              <span className="badge rounded-pill px-2 py-1" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px' }}>
                                ✓ Active
                              </span>
                            )}
                            {isResigned && (
                              <span className="badge rounded-pill px-2 py-1" style={{ background: '#fff7ed', color: '#d97706', fontSize: '11px' }}>
                                ⚠ Resigned
                              </span>
                            )}
                            {isTerminated && (
                              <span className="badge rounded-pill px-2 py-1" style={{ background: '#fef2f2', color: '#dc2626', fontSize: '11px' }}>
                                ✕ Terminated
                              </span>
                            )}
                          </td>
                          <td className="small text-muted">
                            {formatDateSafe(staff.joined_date)}
                          </td>
                          <td className="small">
                            {staff.leaving_date
                              ? <span className="text-warning fw-bold">{formatDateSafe(staff.leaving_date)}</span>
                              : <span className="text-muted">—</span>
                            }
                          </td>
                          <td className="fw-bold text-dark">
                            <div className="d-flex align-items-center gap-2">
                              <span>
                                {showSalaries[staff.id]
                                  ? `₹${parseFloat(staff.base_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                  : '••••••'
                                }
                              </span>
                              <Button
                                variant="link"
                                className="text-muted p-0 border-0 bg-transparent"
                                onClick={() => toggleSalaryVisibility(staff.id)}
                              >
                                {showSalaries[staff.id] ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                              </Button>
                            </div>
                            <div className="text-muted text-xs text-capitalize">{staff.salary_type}</div>
                          </td>
                          <td className="text-end">
                            {!isSuspended && (
                              <div className="d-flex justify-content-end align-items-center gap-1">
                                <Button
                                  variant="link"
                                  className="text-primary p-1 border-0 bg-transparent"
                                  onClick={() => handleEditStaff(staff)}
                                  title="Edit Staff Details"
                                >
                                  <FaEdit className="fs-5" />
                                </Button>
                                {isActive ? (
                                  <Button
                                    variant="link"
                                    className="p-1 border-0 bg-transparent"
                                    style={{ color: '#d97706' }}
                                    onClick={() => handleOpenResignModal(staff)}
                                    title="Mark as Resigned / Left Job"
                                  >
                                    <FaUserSlash className="fs-5" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="link"
                                    className="p-1 border-0 bg-transparent text-success"
                                    onClick={() => handleReactivateStaff(staff)}
                                    title="Reactivate Staff Member"
                                  >
                                    <FaUserCheck className="fs-5" />
                                  </Button>
                                )}
                                <Button
                                  variant="link"
                                  className="text-danger p-1 border-0 bg-transparent"
                                  onClick={() => handleDeleteStaff(staff)}
                                  title="Delete Staff Member (only if no history)"
                                >
                                  <FaTrash className="fs-5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          )}


          {/* TAB 2: MONTHLY LEDGER REGISTER BOOK (PHYSICAL STYLE REGISTER GRID WITH CELL SELECTS) */}
          {activeTab === 'attendance' && (
            <div>
              <Row className="mb-4 align-items-center">
                <Col md={6} className="mb-3 mb-md-0">
                  <Form.Group className="d-flex align-items-center gap-2">
                    <Form.Label className="text-muted mb-0 text-nowrap fw-bold" style={{ fontSize: '12px' }}>
                      <FaCalendarAlt className="me-1 text-primary" /> LEDGER REGISTER MONTH:
                    </Form.Label>
                    <Form.Control 
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="form-control"
                      style={{ maxWidth: '200px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="text-md-end">
                  {!isSuspended && (
                    <Button 
                      variant="success" 
                      className="rounded-pill px-4 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                      onClick={handleSaveLedgerBook}
                      disabled={!hasAttendanceChanges}
                    >
                      <FaSave /> Save Ledger Register Book
                    </Button>
                  )}
                </Col>
              </Row>

              {/* Ledger header with filter toggle */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted small">
                  Showing <strong>{staffList.filter(s => {
                    const [y, m] = selectedMonth.split('-').map(Number);
                    return isStaffActiveInMonth(s, y, m) || (showResignedInLedger && s.status !== 'active');
                  }).length}</strong> of {staffList.length} staff members
                </div>
                <Form.Check
                  type="switch"
                  id="showResignedSwitch"
                  label={<span className="text-muted small">Show resigned staff history</span>}
                  checked={showResignedInLedger}
                  onChange={(e) => setShowResignedInLedger(e.target.checked)}
                />
              </div>
              {(() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                const filteredStaff = staffList.filter(s =>
                  isStaffActiveInMonth(s, y, m) || (showResignedInLedger && s.status !== 'active')
                );
                if (filteredStaff.length === 0) {
                  return (
                    <div className="text-center py-5 text-muted">
                      <FaCalendarAlt size={32} className="mb-3 opacity-25" />
                      <div className="fw-bold">No staff employed in {new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                      <div className="small mt-1">Add staff or toggle "Show resigned staff history" above.</div>
                    </div>
                  );
                }
                return (
                  <div className="saas-ledger-book-wrapper">
                    <table className="saas-ledger-book-table">
                      <thead>
                        <tr>
                          <th>Staff Member</th>
                          {daysInActiveMonth.map(dayObj => (
                            <th 
                              key={dayObj.day} 
                              className={`text-center py-2 px-1 ${dayObj.isSunday ? 'bg-danger bg-opacity-10' : ''}`}
                              style={{ minWidth: '95px' }} 
                              title={dayObj.dateStr}
                            >
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: dayObj.isSunday ? '#dc2626' : '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
                                {dayObj.dayName}
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: dayObj.isSunday ? '#dc2626' : '#0f172a', marginTop: '1px' }}>
                                {dayObj.day < 10 ? `0${dayObj.day}` : dayObj.day}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map(staff => {
                          const isInactive = staff.status !== 'active';
                          return (
                            <tr key={staff.id} style={isInactive ? { borderLeft: '3px solid #f59e0b', opacity: 0.85 } : {}}>
                              <td>
                                <div className="d-flex flex-column">
                                  <span className="text-dark fw-bold">{staff.name}</span>
                                  <span className="text-muted text-xs">{staff.role}</span>
                                  {isInactive && (
                                    <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                                      ⚠ {staff.status === 'resigned' ? 'Resigned' : 'Terminated'} {staff.leaving_date ? new Date(staff.leaving_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {daysInActiveMonth.map(dayObj => {
                                const cellState = getCellState(staff, dayObj.dateStr);
                                const status = ledgerBookState[staff.id]?.[dayObj.dateStr];

                                if (cellState.disabled) {
                                  return (
                                    <td key={dayObj.day} title={cellState.reason} style={{ background: '#f1f5f9', cursor: 'not-allowed' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <FaLock size={9} color="#cbd5e1" title={cellState.reason} />
                                      </div>
                                    </td>
                                  );
                                }

                                let selectClass = 'select-unset';
                                if (status === 'Present') selectClass = 'select-p';
                                else if (status === 'Half Day') selectClass = 'select-h';
                                else if (status === 'Absent') selectClass = 'select-a';
                                else if (status === 'Holiday') selectClass = 'select-o';

                                return (
                                  <td key={dayObj.day}>
                                    <select
                                      value={status || ''}
                                      onChange={(e) => handleCellStatusSelect(staff.id, dayObj.dateStr, e.target.value)}
                                      className={`saas-ledger-select ${selectClass}`}
                                      disabled={isSuspended}
                                    >
                                      <option value="">-</option>
                                      <option value="Present">Present</option>
                                      <option value="Half Day">Half Day</option>
                                      <option value="Absent">Absent</option>
                                      <option value="Holiday">Holiday</option>
                                    </select>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}


                  {/* ATTENDANCE LEGEND */}
                  <div className="saas-ledger-legend">
                    <div className="saas-ledger-legend-item">
                      <span className="badge select-p px-2.5 py-1 text-success font-bold">Present</span>
                      <span>Full day work (Earns 100% pay rate)</span>
                    </div>
                    <div className="saas-ledger-legend-item">
                      <span className="badge select-h px-2.5 py-1 text-warning font-bold">Half Day</span>
                      <span>Half day work (Earns 50% pay rate)</span>
                    </div>
                    <div className="saas-ledger-legend-item">
                      <span className="badge select-a px-2.5 py-1 text-danger font-bold">Absent</span>
                      <span>Unpaid absence (Earns 0% pay rate)</span>
                    </div>
                    <div className="saas-ledger-legend-item">
                      <span className="badge select-o px-2.5 py-1 text-info font-bold">Holiday</span>
                      <span>Paid shop off-day / holiday (Earns 100% pay rate)</span>
                    </div>
                  </div>
            </div>
          )}

          {/* TAB 3: PAYROLL & ACCOUNTS LEDGERS */}
          {activeTab === 'accounts' && (
            <div>
              <Row className="mb-4 align-items-center">
                <Col md={4}>
                  <Form.Group className="d-flex align-items-center gap-2">
                    <Form.Label className="text-muted mb-0 text-nowrap fw-bold" style={{ fontSize: '12px' }}>
                      <FaCalendarAlt className="me-1 text-primary" /> TARGET MONTH:
                    </Form.Label>
                    <Form.Control 
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="form-control"
                      style={{ maxWidth: '200px' }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="table-responsive">
                <Table className="saas-table align-middle">
                  <thead>
                    <tr>
                      <th>Employee Details</th>
                      <th>Salary Settings</th>
                      <th>Attendance Record</th>
                      <th>Calculated Salary</th>
                      <th>Total Paid</th>
                      <th>Pending Balance</th>
                      <th className="text-end">Actions & Ledger Tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedPayrollData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          No staff accounts found. Add staff members in Tab 1 first.
                        </td>
                      </tr>
                    ) : (
                      calculatedPayrollData.map((staff) => {
                        const earned = Math.round(staff.earnedSalary);
                        const paid = Math.round(staff.totalPaid);
                        const pending = Math.round(staff.pendingSalary);
                        const isResigned = staff.status === 'resigned' || staff.status === 'terminated';

                        return (
                          <tr key={staff.id} style={isResigned ? { borderLeft: '3px solid #f59e0b', background: 'rgba(251,191,36,0.03)' } : {}}>
                            <td>
                              <strong className="text-dark d-block">{staff.name}</strong>
                              <span className="text-muted small">{staff.role}</span>
                              {isResigned && (
                                <div className="mt-1">
                                  <span className="badge rounded-pill px-2 py-1" style={{ background: '#fff7ed', color: '#d97706', fontSize: '10px', fontWeight: 600 }}>
                                    ⚠ {staff.status === 'resigned' ? 'Resigned' : 'Terminated'}
                                    {staff.leaving_date ? ` · ${formatDateSafe(staff.leaving_date)}` : ''}
                                  </span>
                                  {pending > 0 && (
                                    <div className="text-danger text-xs mt-1 fw-bold">⚡ Dues pending — settle before closure</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="small">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="fw-bold">
                                    {showSalaries[staff.id] 
                                      ? `₹${parseFloat(staff.base_salary).toLocaleString('en-IN')}` 
                                      : '••••••'
                                    }
                                  </span>
                                  <Button 
                                    variant="link" 
                                    className="text-muted p-0 border-0 bg-transparent"
                                    onClick={() => toggleSalaryVisibility(staff.id)}
                                  >
                                    {showSalaries[staff.id] ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                                  </Button>
                                </div>
                                <div className="text-muted text-capitalize text-xs">{staff.salary_type} rate</div>
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <div>Paid: <span className="text-success fw-bold">{staff.attendanceSummary.paidDays}</span> / {staff.totalDaysInMonth} days</div>
                                <div className="text-muted text-xs mt-0.5">
                                  P: {staff.attendanceSummary.present} | H: {staff.attendanceSummary.halfDay} | Hld: {staff.attendanceSummary.holiday} | A: {staff.attendanceSummary.absent}
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong className="text-dark">
                                ₹{earned.toLocaleString('en-IN')}
                              </strong>
                              <div className="text-muted text-xs">Earned</div>
                            </td>
                            <td>
                              <strong className="text-success">
                                ₹{paid.toLocaleString('en-IN')}
                              </strong>
                            </td>
                            <td>
                              <strong className={pending < 0 ? "text-warning" : pending > 0 ? "text-danger" : "text-success"}>
                                {pending < 0 ? `Advance: ₹${Math.abs(pending).toLocaleString('en-IN')}` : `₹${pending.toLocaleString('en-IN')}`}
                              </strong>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-1.5">
                                {!isSuspended && (
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    className="rounded-pill px-3 py-1 text-xs fw-bold shadow-sm"
                                    onClick={() => handleOpenPayModal(staff)}
                                    title="Pay outstanding salary or cash advance"
                                  >
                                    <FaMoneyBillWave className="me-1" /> Pay Staff / Give Money
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  className="rounded-pill px-2.5 py-1 text-xs fw-bold"
                                  onClick={() => handleViewLedger(staff)}
                                  title="View transaction ledger logs"
                                >
                                  <FaHistory className="me-1" /> Ledger
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  className="rounded-pill px-2.5 py-1 text-xs fw-bold border-success border-opacity-50 text-success"
                                  onClick={() => handleSendWhatsAppSummary(staff)}
                                  title="Send WhatsApp monthly account summary statement"
                                >
                                  <FaWhatsapp className="me-1 fs-6" /> WhatsApp
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {/* TAB 4: MONTHLY ANALYTICS REPORTS & PRINT SHEETS */}
          {activeTab === 'reports' && (
            <div>
              {/* ANALYTICS HIGHLIGHTS CARDS */}
              <Row className="mb-4">
                <Col md={3} className="mb-3 mb-md-0">
                  <Card className="border p-3 rounded bg-light">
                    <div className="small text-muted font-bold text-uppercase">Avg attendance</div>
                    <h3 className="text-primary mt-2 mb-0 fw-bold">{analyticsData.avgAttendance.toFixed(1)}%</h3>
                    <div className="text-muted text-xs mt-1">Across all staff</div>
                  </Card>
                </Col>
                <Col md={3} className="mb-3 mb-md-0">
                  <Card className="border p-3 rounded bg-light">
                    <div className="small text-muted font-bold text-uppercase">Total Earned Liability</div>
                    <h3 className="text-dark mt-2 mb-0 fw-bold">₹{analyticsData.totalLiability.toLocaleString('en-IN')}</h3>
                    <div className="text-muted text-xs mt-1">Salary earned this month</div>
                  </Card>
                </Col>
                <Col md={3} className="mb-3 mb-md-0">
                  <Card className="border p-3 rounded bg-light">
                    <div className="small text-muted font-bold text-uppercase">Total Payouts Issued</div>
                    <h3 className="text-success mt-2 mb-0 fw-bold">₹{analyticsData.totalPaid.toLocaleString('en-IN')}</h3>
                    <div className="text-muted text-xs mt-1">Paid out this month</div>
                  </Card>
                </Col>
                <Col md={3} className="mb-3 mb-md-0">
                  <Card className="border p-3 rounded bg-light">
                    <div className="small text-muted font-bold text-uppercase">Net Outstanding Balance</div>
                    <h3 className={`mt-2 mb-0 fw-bold ${analyticsData.totalPending >= 0 ? "text-danger" : "text-warning"}`}>
                      ₹{analyticsData.totalPending.toLocaleString('en-IN')}
                    </h3>
                    <div className="text-muted text-xs mt-1">Unpaid / Advance total</div>
                  </Card>
                </Col>
              </Row>

              {/* REPORT ACTION BAR */}
              <Row className="mb-3 align-items-center">
                <Col md={6}>
                  <Form.Group className="d-flex align-items-center gap-2">
                    <Form.Label className="text-muted mb-0 text-nowrap fw-bold" style={{ fontSize: '12px' }}>
                      <FaCalendarAlt className="me-1 text-primary" /> REPORT MONTH:
                    </Form.Label>
                    <Form.Control 
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="form-control"
                      style={{ maxWidth: '200px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="text-md-end">
                  <Button 
                    variant="outline-primary" 
                    className="rounded-pill px-4 py-1.5 fw-bold d-inline-flex align-items-center gap-2"
                    onClick={handlePrintPayrollReport}
                  >
                    <FaPrint /> Print Monthly Sheet
                  </Button>
                </Col>
              </Row>

              {/* PRINTABLE AREA — cloned into iframe on print, uses semantic HTML + inline styles */}
              <div id="payroll-print-region" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', background: '#fff', marginTop: '16px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', color: '#1e293b' }}>{activeGarage?.name || 'Garage Shop'}</h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Attendance &amp; Payroll Ledger Statement</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '4px' }}>Statement Period</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                      {new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Employee','Role','Salary Rate','Present','Half Day','Holiday','Absent','Paid Days','Earned','Total Paid','Outstanding'].map((h, i) => (
                          <th key={i} style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: i >= 8 ? 'right' : i >= 3 ? 'center' : 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#475569' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedPayrollData.length === 0 ? (
                        <tr>
                          <td colSpan="11" style={{ border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center', color: '#94a3b8' }}>No employees onboarded.</td>
                        </tr>
                      ) : (
                        calculatedPayrollData.map(staff => (
                          <tr key={staff.id}>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', fontWeight: 700 }}>{staff.name}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px' }}>{staff.role}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'center' }}>
                              ₹{parseFloat(staff.base_salary).toLocaleString('en-IN')} <span style={{ fontSize: '10px', color: '#94a3b8' }}>({staff.salary_type})</span>
                            </td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'center' }}>{staff.attendanceSummary.present}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'center' }}>{staff.attendanceSummary.halfDay}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'center' }}>{staff.attendanceSummary.holiday}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'center' }}>{staff.attendanceSummary.absent}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{staff.attendanceSummary.paidDays}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>₹{Math.round(staff.earnedSalary).toLocaleString('en-IN')}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>₹{Math.round(staff.totalPaid).toLocaleString('en-IN')}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                              {staff.pendingSalary < 0
                                ? <span style={{ color: '#d97706' }}>Adv: ₹{Math.abs(Math.round(staff.pendingSalary)).toLocaleString('en-IN')}</span>
                                : <span style={{ color: '#dc2626' }}>₹{Math.round(staff.pendingSalary).toLocaleString('en-IN')}</span>
                              }
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


        </Card.Body>
      </Card>

      {/* STAFF DETAIL MODAL (ADD / EDIT) */}
      {showStaffModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom p-4 bg-light">
                <h5 className="modal-title fw-bold text-dark">{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowStaffModal(false)}></button>
              </div>
              <Form onSubmit={handleSaveStaff}>
                <div className="modal-body p-4">
                  <Form.Group className="mb-3">
                    <Form.Label className="saas-label">Employee Name</Form.Label>
                    <Form.Control
                      type="text"
                      className="form-control"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="Enter full name..."
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="saas-label">Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      className="form-control"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                    />
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="saas-label">Role / Designation</Form.Label>
                        <Form.Select
                          className="form-select"
                          value={staffForm.role}
                          onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                        >
                          <option value="Mechanic">Mechanic</option>
                          <option value="Helper">Helper</option>
                          <option value="Washing Guy">Washing Guy</option>
                          <option value="Electrician">Electrician</option>
                          <option value="Manager">Manager</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="saas-label">Joined Date</Form.Label>
                        <Form.Control
                          type="date"
                          className="form-control"
                          value={staffForm.joined_date}
                          onChange={(e) => setStaffForm({ ...staffForm, joined_date: e.target.value })}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="saas-label">Salary Model</Form.Label>
                        <Form.Select
                          className="form-select"
                          value={staffForm.salary_type}
                          onChange={(e) => setStaffForm({ ...staffForm, salary_type: e.target.value })}
                        >
                          <option value="monthly">Monthly Flat</option>
                          <option value="daily">Daily Wage</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="saas-label">
                          {staffForm.salary_type === 'daily' ? 'Daily Wage Rate (₹)' : 'Monthly Base Salary (₹)'}
                        </Form.Label>
                        <Form.Control
                          type="number"
                          className="form-control"
                          value={staffForm.base_salary || ''}
                          onChange={(e) => setStaffForm({ ...staffForm, base_salary: parseFloat(e.target.value) || 0 })}
                          placeholder="e.g. 15000"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
                <div className="modal-footer border-top p-4 bg-light">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowStaffModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold rounded-pill px-4">
                    {editingStaff ? 'Save Changes' : 'Onboard Staff'}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* RECORD SINGLE UNIFIED PAYMENT MODAL */}
      {showTxModal && txStaff && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom p-4 bg-light">
                <h5 className="modal-title fw-bold text-dark">
                  Give Money / Record Payout
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTxModal(false)}></button>
              </div>
              <Form onSubmit={handlePayStaffSubmit}>
                <div className="modal-body p-4">
                  <div className="p-3 border rounded bg-light mb-4">
                    <p className="mb-1.5 text-muted small">Paying employee: <strong>{txStaff.name}</strong></p>
                    <div className="d-flex flex-wrap gap-3 small justify-content-between mt-1">
                      <div>Salary Earned: <strong className="text-dark">₹{Math.round(calculatedPayrollData.find(c => Number(c.id) === Number(txStaff.id))?.earnedSalary || 0).toLocaleString('en-IN')}</strong></div>
                      <div>Total Paid: <strong className="text-success">₹{Math.round(calculatedPayrollData.find(c => Number(c.id) === Number(txStaff.id))?.totalPaid || 0).toLocaleString('en-IN')}</strong></div>
                      <div>Pending Balance: <strong className="text-danger">₹{Math.round(calculatedPayrollData.find(c => Number(c.id) === Number(txStaff.id))?.pendingSalary || 0).toLocaleString('en-IN')}</strong></div>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="saas-label">Amount Given (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      className="form-control"
                      value={txForm.amount}
                      onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                      placeholder="Enter amount given..."
                      required
                    />
                    {txForm.amount && parseFloat(txForm.amount) > 0 && (() => {
                      const pendingAmt = calculatedPayrollData.find(c => Number(c.id) === Number(txStaff.id))?.pendingSalary || 0;
                      const inputAmt = parseFloat(txForm.amount);
                      if (inputAmt > pendingAmt) {
                        const excess = Math.round(inputAmt - pendingAmt);
                        return (
                          <div className="badge bg-warning text-dark border-0 mt-2 px-2.5 py-1.5 text-wrap w-100 text-start" style={{ fontSize: '11px', borderRadius: '8px' }}>
                            ⚠️ Note: Paying more than pending balance. The excess ₹{excess.toLocaleString('en-IN')} will automatically be recorded as **Advance Salary**.
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="saas-label">Transaction Date</Form.Label>
                        <Form.Control
                          type="date"
                          className="form-control"
                          value={txForm.date}
                          min={txStaff.joined_date ? txStaff.joined_date.split('T')[0] : undefined}
                          max={txStaff.leaving_date ? txStaff.leaving_date.split('T')[0] : undefined}
                          onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                          required
                        />
                        {txStaff.joined_date && (
                          <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                            Tenure: {new Date(txStaff.joined_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {txStaff.leaving_date ? ` to ${new Date(txStaff.leaving_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ' onwards'}
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="saas-label">Payment Method</Form.Label>
                        <Form.Select
                          className="form-select"
                          value={txForm.payment_method}
                          onChange={(e) => setTxForm({ ...txForm, payment_method: e.target.value })}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / GPay / PhonePe</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="saas-label">Remarks / Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      className="form-control"
                      value={txForm.notes}
                      onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                      placeholder="Write payment reason, UPI reference ID, notes..."
                    />
                  </Form.Group>

                  {/* WHATSAPP NOTIFICATION OPTION (PRE-FLIGHT CONTROL) */}
                  {activeGarage?.feature_whatsapp && activeGarage?.feature_whatsapp_utility !== false && (
                    <div className="form-check form-switch p-3 border rounded bg-light mt-3">
                      <input 
                        className="form-check-input ms-0 me-3" 
                        type="checkbox" 
                        id="tx_send_whatsapp" 
                        checked={txForm.send_whatsapp} 
                        onChange={(e) => setTxForm({ ...txForm, send_whatsapp: e.target.checked })} 
                        disabled={activeGarage?.whatsapp_status !== 'connected'}
                      />
                      <label className="form-check-label text-dark fw-bold" htmlFor="tx_send_whatsapp">
                        {activeGarage?.whatsapp_status === 'connected' 
                          ? '💬 Send Transaction summary update via WhatsApp' 
                          : '🔴 Cannot send WhatsApp: WhatsApp disconnected. Scan QR in settings.'
                        }
                      </label>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top p-4 bg-light">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowTxModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold rounded-pill px-4">
                    Confirm & Save Payout
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* LEDGER STATEMENT MODAL */}
      {showLedgerModal && ledgerStaff && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="modal-title fw-bold text-dark">Staff Account Ledger</h5>
                  <p className="text-muted mb-0 small">{ledgerStaff.name} ({ledgerStaff.role})</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowLedgerModal(false)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                <Table className="saas-table align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction Type</th>
                      <th>Payment Mode</th>
                      <th>Amount</th>
                      <th>Notes / Remarks</th>
                      {!isSuspended && <th className="text-end">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No transactions recorded yet in this employee's ledger.
                        </td>
                      </tr>
                    ) : (
                      ledgerTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                          <td>
                            <Badge 
                              bg={tx.type === 'Advance' ? 'warning' : 'success'}
                              className={`bg-opacity-10 ${tx.type === 'Advance' ? 'text-warning border-warning' : 'text-success border-success'} border border-opacity-25 px-2.5 py-1.5`}
                              style={{ fontSize: '10px', borderRadius: '20px' }}
                            >
                              {tx.type === 'Advance' ? 'Advance Salary' : 'Salary Payout'}
                            </Badge>
                          </td>
                          <td>{tx.payment_method}</td>
                          <td className="fw-bold text-dark">
                            ₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="small text-muted">{tx.notes || '—'}</td>
                          {!isSuspended && (
                            <td className="text-end">
                              <Button
                                variant="link"
                                className="text-danger p-1 border-0 bg-transparent"
                                onClick={() => handleDeleteTransaction(tx.id)}
                                title="Delete/Rollback transaction entry"
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
              <div className="modal-footer border-top p-4 bg-light">
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowLedgerModal(false)}>Close Statement</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARK STAFF AS RESIGNED / TERMINATED MODAL */}
      {showResignModal && resigningStaff && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom p-4 bg-light">
                <h5 className="modal-title fw-bold text-dark">Staff Resignation / Leaving Job</h5>
                <button type="button" className="btn-close" onClick={() => setShowResignModal(false)}></button>
              </div>
              <Form onSubmit={handleResignStaff}>
                <div className="modal-body p-4">
                  <div className="p-3 border rounded bg-warning bg-opacity-10 text-dark mb-4">
                    <p className="mb-1 text-muted small">Employee Record:</p>
                    <h6 className="fw-bold mb-1">{resigningStaff.name} ({resigningStaff.role})</h6>
                    <span className="text-muted small">Joined: {formatDateSafe(resigningStaff.joined_date)}</span>
                  </div>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="saas-label">Leaving Status</Form.Label>
                        <Form.Select
                          className="form-select"
                          value={resignForm.status}
                          onChange={(e) => setResignForm({ ...resignForm, status: e.target.value })}
                        >
                          <option value="resigned">Resigned (Left Job)</option>
                          <option value="terminated">Terminated (Relieved)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="saas-label">Leaving Date</Form.Label>
                        <Form.Control
                          type="date"
                          className="form-control"
                          value={resignForm.leaving_date}
                          min={resigningStaff.joined_date ? resigningStaff.joined_date.split('T')[0] : undefined}
                          onChange={(e) => setResignForm({ ...resignForm, leaving_date: e.target.value })}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="saas-label">Reason / Exit Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      className="form-control"
                      value={resignForm.leaving_notes}
                      onChange={(e) => setResignForm({ ...resignForm, leaving_notes: e.target.value })}
                      placeholder="Write exit notes, resignation reason..."
                    />
                  </Form.Group>
                </div>
                <div className="modal-footer border-top p-4 bg-light">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowResignModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning fw-bold text-dark rounded-pill px-4">
                    Confirm Status Change
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

    </Container>
  );
};

export default PayrollPage;
