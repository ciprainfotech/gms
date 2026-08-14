import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Tabs, Tab, Spinner, Table, Badge, Alert } from 'react-bootstrap';
import {
    FaChartPie, FaChartLine, FaTools, FaRupeeSign, FaUsers, FaFilePdf, FaFileCsv, FaCalendarAlt, FaDownload, FaExclamationTriangle, FaCheckCircle, FaBox, FaReceipt, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import api from '../api/api';
import { useGarage } from '../contexts/GarageContext';
import '../App.css';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const AnalyticsReportsPage = () => {
    const { garage } = useGarage();
    const [dateRange, setDateRange] = useState('month');
    const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });
    const [activeTab, setActiveTab] = useState('financial');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const printRef = useRef();

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `/analytics?range=${dateRange}`;
            if (dateRange === 'custom' && customDates.startDate && customDates.endDate) {
                url += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
            }
            const res = await api.get(url);
            if (res.ok) {
                const resData = await res.json();
                if (resData.success) {
                    setData(resData);
                } else {
                    setError('Failed to fetch analytics metrics.');
                }
            } else {
                setError('Error connecting to analytics engine.');
            }
        } catch (err) {
            console.error('Analytics Fetch Error:', err);
            setError('Server error while loading analytics data.');
        } finally {
            setLoading(false);
        }
    }, [dateRange, customDates]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // CSV Export Handler
    const handleExportCSV = () => {
        if (!data || !data.summary) return;
        const s = data.summary;
        const csvRows = [
            ['CIPRA INFOTECH GMS - EXECUTIVE FINANCIAL REPORT'],
            ['Garage Name', garage?.name || 'My Garage'],
            ['Report Date Range', dateRange.toUpperCase()],
            ['Generated On', new Date().toLocaleString('en-IN')],
            [''],
            ['METRIC', 'VALUE (INR)'],
            ['Total Gross Revenue', s.totalRevenue],
            ['Collected Revenue', s.collectedRevenue],
            ['Outstanding Receivables', s.outstandingReceivable],
            ['Total Expenses (Purchases)', s.totalExpenses],
            ['Net Operating Profit', s.netProfit],
            ['Total Jobs Completed', s.jobsCompleted],
            ['New Customers Registered', s.newCustomers],
            ['Average Invoice Value', s.averageOrderValue],
            ['Total Invoices Issued', s.totalInvoices],
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Executive_Financial_Report_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print / PDF Export Handler
    const handlePrintPDF = () => {
        window.print();
    };

    const summary = data?.summary || {};
    const monthlyTrend = data?.monthlyTrend || [];
    const paymentMethods = data?.paymentMethods || { cash: 0, upi: 0, card: 0, netbanking: 0, other: 0 };
    const topServices = data?.topServices || [];
    const topSpares = data?.topSpares || [];
    const topCustomers = data?.topCustomers || [];

    // Chart 1: Revenue vs Expense Monthly Trend Line
    const revenueVsExpenseChart = {
        labels: monthlyTrend.map(m => m.month),
        datasets: [
            {
                label: 'Gross Revenue (₹)',
                data: monthlyTrend.map(m => parseFloat(m.revenue)),
                fill: true,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                tension: 0.3,
            },
            {
                label: 'Expenses (₹)',
                data: monthlyTrend.map(m => parseFloat(m.expenses)),
                fill: true,
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                tension: 0.3,
            }
        ],
    };

    // Chart 2: Jobs Completed Monthly Bar
    const jobsTrendChart = {
        labels: monthlyTrend.map(m => m.month),
        datasets: [
            {
                label: 'Jobs Completed',
                data: monthlyTrend.map(m => parseInt(m.jobs)),
                backgroundColor: '#10B981',
                borderRadius: 8,
            }
        ]
    };

    // Chart 3: Payment Method Distribution Doughnut
    const paymentModeChart = {
        labels: ['Cash', 'UPI / Online', 'Cards', 'Bank / NEFT', 'Other'],
        datasets: [
            {
                data: [
                    paymentMethods.cash,
                    paymentMethods.upi,
                    paymentMethods.card,
                    paymentMethods.netbanking,
                    paymentMethods.other
                ],
                backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#64748B'],
                borderWidth: 2,
            }
        ]
    };

    // Chart 4: Top Services Bar
    const topServicesChart = {
        labels: topServices.map(s => s.name),
        datasets: [
            {
                label: 'Revenue Contribution (₹)',
                data: topServices.map(s => parseFloat(s.totalRevenue)),
                backgroundColor: '#6366F1',
                borderRadius: 6,
            }
        ]
    };

    return (
        <Container fluid className="py-4">
            {/* --- TOP EXECUTIVE HEADER & CONTROLS --- */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold text-dark mb-1 d-flex align-items-center" style={{ letterSpacing: '-0.5px' }}>
                        <FaChartLine className="me-2 text-primary" /> Analytics & Executive Reports
                    </h2>
                    <p className="text-muted mb-0 small">Real-time workshop revenue performance, P&L statement, job volume, & spare part consumption.</p>
                </div>

                {/* Filter & Export Action Bar */}
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <div className="d-flex align-items-center bg-white border rounded-pill px-3 py-1.5 shadow-sm">
                        <FaCalendarAlt className="text-muted me-2" />
                        <Form.Select 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value)} 
                            className="border-0 bg-transparent shadow-none p-0 fw-bold text-dark"
                            style={{ fontSize: '13px', cursor: 'pointer', width: 'auto' }}
                        >
                            <option value="month">This Month</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="quarter">Last 90 Days</option>
                            <option value="year">Financial Year</option>
                            <option value="custom">Custom Range...</option>
                        </Form.Select>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="d-flex align-items-center gap-1 bg-white border rounded-pill px-3 py-1 shadow-sm">
                            <Form.Control 
                                type="date" 
                                size="sm" 
                                className="border-0 bg-transparent p-0 shadow-none" 
                                value={customDates.startDate} 
                                onChange={e => setCustomDates({ ...customDates, startDate: e.target.value })} 
                            />
                            <span className="text-muted small">to</span>
                            <Form.Control 
                                type="date" 
                                size="sm" 
                                className="border-0 bg-transparent p-0 shadow-none" 
                                value={customDates.endDate} 
                                onChange={e => setCustomDates({ ...customDates, endDate: e.target.value })} 
                            />
                        </div>
                    )}

                    <Button variant="outline-success" className="rounded-pill fw-bold shadow-sm d-flex align-items-center gap-1.5" onClick={handleExportCSV}>
                        <FaFileCsv /> Export CSV
                    </Button>
                    <Button variant="primary" className="rounded-pill fw-bold shadow-sm d-flex align-items-center gap-1.5" onClick={handlePrintPDF} style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none' }}>
                        <FaFilePdf /> Download Executive PDF
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="danger" className="mb-4 shadow-sm border-0 rounded-3">
                    <FaExclamationTriangle className="me-2" /> {error}
                </Alert>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted fw-semibold">Computing live financial & performance analytics...</p>
                </div>
            ) : (
                <div ref={printRef}>
                    {/* --- PRINT ONLY EXECUTIVE HEADER --- */}
                    <div className="d-none d-print-block mb-4 p-4 border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="fw-bold text-dark mb-1">{garage?.name || 'Garage Workshop'}</h2>
                                <p className="text-muted mb-0">{garage?.address} | Phone: {garage?.phone}</p>
                                <p className="text-muted mb-0">GSTIN: {garage?.gstin || 'N/A'}</p>
                            </div>
                            <div className="text-end">
                                <h4 className="fw-bold text-primary mb-1">EXECUTIVE FINANCIAL REPORT</h4>
                                <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill">
                                    Period: {dateRange.toUpperCase()} ({new Date().toLocaleDateString('en-IN')})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* --- EXECUTIVE KPI METRICS ROW --- */}
                    <Row className="g-3 mb-4">
                        <Col md={4} lg={2}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #4F46E5' }}>
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Gross Revenue</small>
                                <h4 className="fw-bold text-dark mb-1 mt-1">{formatCurrency(summary.totalRevenue)}</h4>
                                <span className="small text-success fw-semibold d-flex align-items-center" style={{ fontSize: '11px' }}>
                                    <FaArrowUp className="me-1" /> {summary.totalInvoices} Invoices
                                </span>
                            </Card>
                        </Col>
                        <Col md={4} lg={2}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Net Operating Profit</small>
                                <h4 className={`fw-bold mb-1 mt-1 ${summary.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(summary.netProfit)}</h4>
                                <span className="small text-muted" style={{ fontSize: '11px' }}>After Purchases & Expenses</span>
                            </Card>
                        </Col>
                        <Col md={4} lg={2}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #3B82F6' }}>
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Completed Jobs</small>
                                <h4 className="fw-bold text-dark mb-1 mt-1">{summary.jobsCompleted}</h4>
                                <span className="small text-primary fw-semibold" style={{ fontSize: '11px' }}>Job Sheets Closed</span>
                            </Card>
                        </Col>
                        <Col md={4} lg={2}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #EF4444' }}>
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Outstanding Receivables</small>
                                <h4 className="fw-bold text-danger mb-1 mt-1">{formatCurrency(summary.outstandingReceivable)}</h4>
                                <span className="small text-danger fw-semibold" style={{ fontSize: '11px' }}>Uncollected Balance</span>
                            </Card>
                        </Col>
                        <Col md={4} lg={2}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>New Customers</small>
                                <h4 className="fw-bold text-dark mb-1 mt-1">{summary.newCustomers}</h4>
                                <span className="small text-warning fw-semibold" style={{ fontSize: '11px' }}>Registered Accounts</span>
                            </Card>
                        </Col>
                        <Col md={4} lg={2}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #8B5CF6' }}>
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Avg Invoice Value</small>
                                <h4 className="fw-bold text-dark mb-1 mt-1">{formatCurrency(summary.averageOrderValue)}</h4>
                                <span className="small text-muted" style={{ fontSize: '11px' }}>Per Completed Invoice</span>
                            </Card>
                        </Col>
                    </Row>

                    {/* --- ANALYTICS VIEW TABS --- */}
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 stock-nav-tabs">
                        {/* TAB 1: FINANCIAL OVERVIEW & P&L */}
                        <Tab eventKey="financial" title={<><FaRupeeSign className="me-2" /> Financial Overview & P&L Statement</>}>
                            <Row className="g-4 mb-4">
                                <Col lg={8}>
                                    <Card className="border-0 shadow-sm rounded-4 p-4 h-100" style={{ backgroundColor: '#FFFFFF' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold text-dark mb-0">Monthly Revenue vs. Expense Trend Line</h6>
                                            <Badge bg="light" className="text-muted border">6-Month Trailing</Badge>
                                        </div>
                                        <div style={{ height: '320px' }}>
                                            <Line data={revenueVsExpenseChart} options={{ responsive: true, maintainAspectRatio: false }} />
                                        </div>
                                    </Card>
                                </Col>
                                <Col lg={4}>
                                    <Card className="border-0 shadow-sm rounded-4 p-4 h-100" style={{ backgroundColor: '#FFFFFF' }}>
                                        <h6 className="fw-bold text-dark mb-3">Payment Method Breakdown</h6>
                                        <div style={{ height: '240px' }} className="d-flex justify-content-center">
                                            <Doughnut data={paymentModeChart} options={{ responsive: true, maintainAspectRatio: false }} />
                                        </div>
                                        <div className="mt-4 pt-3 border-top d-flex justify-content-between small text-muted">
                                            <span>Cash Collected: <strong>{formatCurrency(paymentMethods.cash)}</strong></span>
                                            <span>Digital / UPI: <strong>{formatCurrency(paymentMethods.upi)}</strong></span>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>

                        {/* TAB 2: JOBS & SERVICE PERFORMANCE */}
                        <Tab eventKey="services" title={<><FaTools className="me-2" /> Job Sheets & Service Performance</>}>
                            <Row className="g-4 mb-4">
                                <Col lg={6}>
                                    <Card className="border-0 shadow-sm rounded-4 p-4 h-100" style={{ backgroundColor: '#FFFFFF' }}>
                                        <h6 className="fw-bold text-dark mb-3">Monthly Job Sheets Volume</h6>
                                        <div style={{ height: '300px' }}>
                                            <Bar data={jobsTrendChart} options={{ responsive: true, maintainAspectRatio: false }} />
                                        </div>
                                    </Card>
                                </Col>
                                <Col lg={6}>
                                    <Card className="border-0 shadow-sm rounded-4 p-4 h-100" style={{ backgroundColor: '#FFFFFF' }}>
                                        <h6 className="fw-bold text-dark mb-3">Top 5 Revenue Generating Services</h6>
                                        <div style={{ height: '300px' }}>
                                            <Bar data={topServicesChart} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }} />
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>

                        {/* TAB 3: SPARE PARTS & CONSUMPTION */}
                        <Tab eventKey="spares" title={<><FaBox className="me-2" /> Spare Parts & Inventory Breakdown</>}>
                            <Card className="border-0 shadow-sm rounded-4 p-4 mb-4" style={{ backgroundColor: '#FFFFFF' }}>
                                <h6 className="fw-bold text-dark mb-3">Top Moving Spare Parts & Components</h6>
                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Spare Part Name</th>
                                                <th className="text-center">Total Quantity Consumed</th>
                                                <th className="text-end">Total Revenue Contribution</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topSpares.length > 0 ? (
                                                topSpares.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="fw-bold text-muted">{idx + 1}</td>
                                                        <td className="fw-bold text-dark">{item.name}</td>
                                                        <td className="text-center"><Badge bg="info" pill>{item.totalQty} units</Badge></td>
                                                        <td className="text-end fw-bold text-success">{formatCurrency(item.totalRevenue)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4 text-muted">No spare parts consumption data recorded for this period.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card>
                        </Tab>

                        {/* TAB 4: CUSTOMER & RECEIVABLES INTELLIGENCE */}
                        <Tab eventKey="customers" title={<><FaUsers className="me-2" /> Customer & Receivables Intelligence</>}>
                            <Card className="border-0 shadow-sm rounded-4 p-4 mb-4" style={{ backgroundColor: '#FFFFFF' }}>
                                <h6 className="fw-bold text-dark mb-3">Top 5 Highest Value Client Accounts</h6>
                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Customer Name & Phone</th>
                                                <th className="text-center">Invoices Issued</th>
                                                <th className="text-end">Total Billing Spend</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topCustomers.length > 0 ? (
                                                topCustomers.map((cust, idx) => (
                                                    <tr key={idx}>
                                                        <td className="fw-bold text-muted">{idx + 1}</td>
                                                        <td>
                                                            <div className="fw-bold text-dark">{cust.name}</div>
                                                            <small className="text-muted">{cust.phone}</small>
                                                        </td>
                                                        <td className="text-center"><Badge bg="secondary" pill>{cust.totalInvoices} Visits</Badge></td>
                                                        <td className="text-end fw-bold text-primary">{formatCurrency(cust.totalSpent)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4 text-muted">No customer spending history available for this period.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card>
                        </Tab>
                    </Tabs>

                    {/* --- PRINT ONLY FOOTER & SIGNATURES --- */}
                    <div className="d-none d-print-block pt-5 mt-5 border-top">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <p className="text-muted small mb-0">Generated by Cipra Infotech Garage Management SaaS Engine</p>
                                <p className="text-muted small">Report Authenticated & Confidential</p>
                            </div>
                            <div className="text-center" style={{ width: '220px' }}>
                                <div style={{ borderBottom: '1px solid #000', height: '40px' }}></div>
                                <span className="small fw-bold text-dark mt-1 d-block">Authorized Signatory</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default AnalyticsReportsPage;