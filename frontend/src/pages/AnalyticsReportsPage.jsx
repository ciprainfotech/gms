import React from 'react';
import { Container, Row, Col, Card, Alert, Badge } from 'react-bootstrap';
import {
    FaChartPie,
    FaChartBar,
    FaTools,
    FaRupeeSign,
    FaUsers,
    FaCar, // Keep FaCar if you might use it later
    FaCalendarCheck,
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import '../App.css'; // *** IMPORT THE CSS FILE ***

// *** IMPORTANT: Register Chart.js components ***
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- Mock Data (Keep as is) ---
const generateMonthlyData = (min, max) => {
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * (max - min + 1)) + min);
};

const kpiData = {
    totalRevenueMonth: 185600,
    jobsCompletedMonth: 152,
    newCustomersMonth: 28,
    upcomingAppointments: 15,
};

const monthlyRevenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'Monthly Revenue (₹)',
            data: generateMonthlyData(120000, 210000),
            fill: true,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.3)',
            tension: 0.3,
        },
    ],
};

const jobsCompletedData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'Jobs Completed',
            data: generateMonthlyData(110, 180),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.3,
        },
    ],
};

const serviceBreakdownData = {
    labels: ['General Service', 'Oil Change', 'Tire Repair/Rotation', 'Brake Service', 'AC Repair', 'Other'],
    datasets: [
        {
            label: 'Services This Month',
            data: [45, 30, 25, 18, 12, 22],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
        },
    ],
};

const revenueByServiceData = {
    labels: ['General Service', 'Oil Change', 'Tire Repair/Rotation', 'Brake Service', 'AC Repair', 'Other'],
    datasets: [
        {
            label: 'Revenue (₹)',
            data: [55000, 25000, 32000, 41000, 18000, 14600],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
        },
    ],
};

// --- Chart Options (Keep as is) ---
const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            font: { size: 16 },
        },
        tooltip: {
            mode: 'index',
            intersect: false,
        },
    },
    scales: {
        y: {
            beginAtZero: false,
            ticks: {
                callback: function(value) {
                    return '₹' + value.toLocaleString('en-IN');
                }
            }
        },
    },
};

const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
        legend: {
            display: false,
        },
        title: {
            display: true,
            font: { size: 16 },
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.x !== null) {
                        label += '₹' + context.parsed.x.toLocaleString('en-IN');
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        x: {
            beginAtZero: true,
            ticks: {
                callback: function(value) {
                    return '₹' + value.toLocaleString('en-IN');
                }
            }
        },
    },
};

const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 15,
            }
        },
        title: {
            display: true,
            font: { size: 16 },
        },
        tooltip: {
             callbacks: {
                label: function(context) {
                    let label = context.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed !== null) {
                         const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                         const percentage = Math.round((context.parsed / total) * 100);
                         label += `${context.parsed} (${percentage}%)`;
                    }
                    return label;
                }
            }
        }
    },
};


// --- Component ---
const AnalyticsReportsPage = () => {
    return (
        // Keep main-content class if used for global layout adjustments
        <Container fluid className="py-4 px-md-4 main-content">
            <h2 className="fw-bold text-primary mb-4 d-flex align-items-center">
                <FaChartPie className="me-3" size="1.5em" />Analytics & Reports
            </h2>

            {/* === Key Performance Indicators (KPIs) === */}
            <Row className="g-4 mb-4">
                <Col md={6} lg={3}>
                    {/* Added kpi-card class */}
                    <Card className="shadow-sm border-0 h-100 bg-light kpi-card">
                        <Card.Body className="d-flex align-items-center">
                            <FaRupeeSign size="2.5em" className="text-success me-3 flex-shrink-0" />
                            <div>
                                <div className="text-muted small text-uppercase">Revenue (This Month)</div>
                                <div className="fs-4 fw-bold">₹{kpiData.totalRevenueMonth.toLocaleString('en-IN')}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                     <Card className="shadow-sm border-0 h-100 bg-light kpi-card">
                         <Card.Body className="d-flex align-items-center">
                            <FaTools size="2.5em" className="text-info me-3 flex-shrink-0" />
                             <div>
                                <div className="text-muted small text-uppercase">Jobs Completed (Month)</div>
                                <div className="fs-4 fw-bold">{kpiData.jobsCompletedMonth}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                 <Col md={6} lg={3}>
                    <Card className="shadow-sm border-0 h-100 bg-light kpi-card">
                         <Card.Body className="d-flex align-items-center">
                             <FaUsers size="2.5em" className="text-warning me-3 flex-shrink-0" />
                             <div>
                                <div className="text-muted small text-uppercase">New Customers (Month)</div>
                                <div className="fs-4 fw-bold">{kpiData.newCustomersMonth}</div>
                             </div>
                        </Card.Body>
                    </Card>
                </Col>
                 <Col md={6} lg={3}>
                    <Card className="shadow-sm border-0 h-100 bg-light kpi-card">
                         <Card.Body className="d-flex align-items-center">
                             <FaCalendarCheck size="2.5em" className="text-primary me-3 flex-shrink-0" />
                             <div>
                                <div className="text-muted small text-uppercase">Upcoming Appointments</div>
                                <div className="fs-4 fw-bold">{kpiData.upcomingAppointments}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

             {/* === Charts Row 1: Revenue and Job Trends === */}
            <Row className="g-4 mb-4">
                <Col lg={7}>
                     <Card className="shadow-sm h-100">
                         <Card.Header className="bg-white fw-bold">
                            <FaChartBar className="me-2 text-primary"/>Monthly Revenue Trend (Last 6 Months)
                         </Card.Header>
                         {/* Removed inline style, added className */}
                        <Card.Body className="chart-container-md">
                             <Line options={{...lineChartOptions, plugins: {...lineChartOptions.plugins, title: {...lineChartOptions.plugins.title, text: 'Monthly Revenue (₹)' }}}} data={monthlyRevenueData} />
                        </Card.Body>
                    </Card>
                </Col>
                 <Col lg={5}>
                     <Card className="shadow-sm h-100">
                         <Card.Header className="bg-white fw-bold">
                             <FaTools className="me-2 text-info"/>Jobs Completed Trend
                         </Card.Header>
                         {/* Removed inline style, added className */}
                        <Card.Body className="chart-container-md">
                             <Line options={{...lineChartOptions, scales: { y: { beginAtZero: true } }, plugins: {...lineChartOptions.plugins, title: {...lineChartOptions.plugins.title, text: 'Jobs Completed per Month' }}}} data={jobsCompletedData} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

             {/* === Charts Row 2: Service Breakdown and Revenue per Service === */}
            <Row className="g-4">
                <Col lg={5}>
                     <Card className="shadow-sm h-100">
                         <Card.Header className="bg-white fw-bold">
                             <FaChartPie className="me-2 text-danger"/>Service Breakdown (This Month)
                         </Card.Header>
                         {/* Removed inline style, added className */}
                        <Card.Body className="chart-container-lg">
                            <Doughnut options={{...doughnutChartOptions, plugins: {...doughnutChartOptions.plugins, title: {...doughnutChartOptions.plugins.title, text: 'Job Count by Service Type' }}}} data={serviceBreakdownData} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={7}>
                     <Card className="shadow-sm h-100">
                         <Card.Header className="bg-white fw-bold">
                             {/* Used text-purple class from CSS */}
                             <FaRupeeSign className="me-2 text-purple"/>Revenue by Service Type (This Month)
                         </Card.Header>
                         {/* Removed inline style, added className */}
                        <Card.Body className="chart-container-lg">
                             <Bar options={{...barChartOptions, plugins: {...barChartOptions.plugins, title: {...barChartOptions.plugins.title, text: 'Revenue Contribution by Service (₹)' }}}} data={revenueByServiceData} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add more rows/cards for other analytics */}

            <Alert variant="secondary" className="mt-5">
                <FaChartBar className="me-2" />
                More detailed reports and filtering options are under development. Data shown is illustrative for the last 6 months / current month.
            </Alert>

        </Container>
    );
};

export default AnalyticsReportsPage;