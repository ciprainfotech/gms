import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, InputGroup, Form, Row, Col } from 'react-bootstrap';
import { FaEye, FaSearch, FaFileInvoiceDollar, FaFileInvoice, FaArchive } from 'react-icons/fa';
import {
    initialJobSheets,
    initialInvoices,
    findCustomerById,
    findVehicleById
} from '../data/staticData';

const JobSheets = () => {
    // State for the full list of historical job sheets (loaded once)
    const [allHistoricalSheets, setAllHistoricalSheets] = useState([]);
    // State for search term and status filter
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    // State to store linked invoice IDs for faster lookup
    const [invoiceLinks, setInvoiceLinks] = useState({});

    // --- Load Data and Prepare Invoice Links ---
    useEffect(() => {
        // Filter initialJobSheets for non-active statuses
        const historical = initialJobSheets.filter(
            js => js.status === 'Completed' || js.status === 'Invoiced' || js.status === 'Cancelled'
        );

        // Fetch related data (customer/vehicle names) for display - Simulation
        const historicalWithDetails = historical.map(js => {
            const customer = findCustomerById(js.customerId);
            const vehicle = findVehicleById(js.vehicleId);
            return {
                ...js,
                // Add names directly to the object for easier rendering/filtering
                customerName: customer?.name || 'N/A',
                vehicleNumber: vehicle?.carNumber || 'N/A',
                vehicleModel: vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : 'N/A',
            };
        });

        setAllHistoricalSheets(historicalWithDetails);

        // Create a mapping from jobSheetId to invoiceId for quick linking
        const links = initialInvoices.reduce((acc, inv) => {
            if (inv.jobSheetId) {
                acc[inv.jobSheetId] = inv.id; // Map JobSheetID -> InvoiceID
            }
            return acc;
        }, {});
        setInvoiceLinks(links);

    }, []); // Run only once on mount


    // --- Filtering Logic ---
    const filteredJobSheets = useMemo(() => {
        return allHistoricalSheets.filter(js => {
            const lowerSearch = searchTerm.toLowerCase();
            // Check search term against multiple fields
            const matchesSearch = !searchTerm ||
                js.jobSheetNumber?.toLowerCase().includes(lowerSearch) ||
                js.vehicleNumber?.toLowerCase().includes(lowerSearch) ||
                js.customerName?.toLowerCase().includes(lowerSearch) ||
                js.vehicleModel?.toLowerCase().includes(lowerSearch);

            // Check status filter
            const matchesStatus = !statusFilter || js.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [allHistoricalSheets, searchTerm, statusFilter]);


    // --- Status Badge Helper ---
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return <Badge bg="success">✅ Completed</Badge>;
            case 'invoiced': return <Badge bg="info">🧾 Invoiced</Badge>;
            case 'cancelled': return <Badge bg="danger">❌ Cancelled</Badge>;
            default: return <Badge bg="secondary">{status || 'N/A'}</Badge>;
        }
    };

    return (
        <Container fluid className="py-4">
            <div className="page-header-row">
                <h2 className="page-title-active mb-0">
                    <FaArchive />
                    Job Sheets Archive
                </h2>
                <div className="actions">
                    {/* Placeholder for future action buttons */}
                </div>
            </div>

            <div className="main-content pt-0">
                 {/* Filter Controls */}
                 <Card className="mb-4 shadow-sm border-light">
                     <Card.Header className="bg-light fw-bold">Filter Records</Card.Header>
                    <Card.Body>
                        <Row className="g-3 align-items-center">
                            <Col md={6} lg={5}>
                                <InputGroup>
                                    <Form.Control
                                         placeholder="Search by Job#, Vehicle#, Customer..."
                                         value={searchTerm}
                                         onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <Button variant="outline-secondary" id="button-addon2">
                                        <FaSearch />
                                    </Button>
                                </InputGroup>
                            </Col>
                            <Col md={4} lg={3}>
                                 <Form.Label htmlFor="statusFilterSelect" className="visually-hidden">Status Filter</Form.Label>
                                <Form.Select
                                    id="statusFilterSelect"
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Invoiced">Invoiced</option>
                                    <option value="Cancelled">Cancelled</option>
                                </Form.Select>
                            </Col>
                             <Col md={2} lg={2} className="text-md-end">
                                 <Button variant='secondary' size="sm">Apply Filters</Button>
                             </Col>
                        </Row>
                    </Card.Body>
                 </Card>

                {/* Job Sheet Table */}
                <Card className="shadow-sm border-light">
                    <Card.Header className="bg-light fw-bold">Historical Records ({filteredJobSheets.length} found)</Card.Header>
                    <Card.Body className="p-0">
                         <div className="table-responsive">
                            <Table hover striped className="mb-0 align-middle">
                                <thead className="table-light">
                                     <tr>
                                         <th className="py-3 px-3">Job Sheet #</th>
                                         <th className="py-3 px-3">Date Completed</th>
                                         <th className="py-3 px-3">Vehicle No.</th>
                                         <th className="py-3 px-3">Customer</th>
                                         <th className="py-3 px-3 text-end">Amount</th>
                                         <th className="py-3 px-3">Status</th>
                                         <th className="py-3 px-3 text-center">Actions</th>
                                     </tr>
                                </thead>
                                <tbody>
                                     {filteredJobSheets.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center text-muted py-5">No matching job sheets found for the selected criteria.</td></tr>
                                    ) : (
                                        filteredJobSheets.map((js) => {
                                            const linkedInvoiceId = invoiceLinks[js.id];
                                            return (
                                                <tr key={js.id}>
                                                    <td className="px-3 fw-medium">{js.jobSheetNumber}</td>
                                                    <td className="px-3">{js.dateCompleted || js.dateCreated}</td>
                                                    <td className="px-3">{js.vehicleNumber}</td>
                                                    <td className="px-3">{js.customerName}</td>
                                                    <td className="px-3 text-end">{js.grandTotal?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A'}</td>
                                                    <td className="px-3">{getStatusBadge(js.status)}</td>
                                                    <td className="px-3 text-center">
                                                        <Link to={`/jobsheet/${js.id}`} className="btn btn-outline-secondary btn-sm me-1" title="View Job Sheet Details">
                                                            <FaEye />
                                                        </Link>
                                                        {js.status === 'Invoiced' && linkedInvoiceId && (
                                                            <Link to={`/invoice/${linkedInvoiceId}/view`} className="btn btn-outline-info btn-sm" title="View Invoice">
                                                                <FaFileInvoice />
                                                            </Link>
                                                        )}
                                                        {js.status === 'Completed' && !linkedInvoiceId && (
                                                            <Link to="/create-invoice" state={{ finalizedJobSheet: js }} className="btn btn-outline-primary btn-sm" title="Create Invoice from this Job Sheet">
                                                                <FaFileInvoiceDollar />
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                    <Card.Footer className="text-muted text-end py-2 px-3">
                         Total Records: {allHistoricalSheets.length} | Displaying: {filteredJobSheets.length}
                     </Card.Footer>
                </Card>
            </div>
        </Container>
    );
};
export default JobSheets;