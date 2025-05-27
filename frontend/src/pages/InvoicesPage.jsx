import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, InputGroup, Form, Row, Col, Pagination } from 'react-bootstrap'; // Import Pagination
import { FaEye, FaSearch, FaFilter, FaReceipt, FaPrint } from 'react-icons/fa';
import { initialInvoices } from '../data/staticData';

const ITEMS_PER_PAGE = 10; // Define how many items per page

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState(initialInvoices);
    const [filteredInvoices, setFilteredInvoices] = useState(initialInvoices);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1); // State for current page number

    // Effect to filter invoices when searchTerm or filterStatus changes
    useEffect(() => {
        let result = invoices;

        // Filter by search term
        if (searchTerm) {
            result = result.filter(inv =>
                inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (filterStatus !== 'all') {
            result = result.filter(inv => inv.status === filterStatus);
        }

        setFilteredInvoices(result);
        setCurrentPage(1); // Reset to page 1 whenever filters change

    }, [searchTerm, filterStatus, invoices]);

    // --- Pagination Calculations ---
    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentInvoices = filteredInvoices.slice(startIndex, endIndex); // Invoices for the current page

    // --- Handlers ---
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const formatCurrency = (amount) => {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '₹ 0.00';
        return numericAmount.toLocaleString('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2
        });
    };

    const getStatusBadge = (status) => {
        // ... (keep existing getStatusBadge function)
        switch (status) {
            case 'Paid': return <Badge bg="success">Paid</Badge>;
            case 'Pending': return <Badge bg="warning" text="dark">Pending</Badge>;
            case 'Overdue': return <Badge bg="danger">Overdue</Badge>;
            default: return <Badge bg="secondary">Unknown</Badge>;
        }
    };

    const handlePrintInvoice = (invoiceId) => {
        // ... (keep existing handlePrintInvoice function)
        console.log(`Printing invoice: ${invoiceId}`);
        alert(`Print functionality for Invoice ${invoiceId} TBD.`);
    };

    // --- Dynamic Pagination Items ---
    const renderPaginationItems = () => {
        if (totalPages <= 1) return null; // No pagination needed for 1 page or less

        const items = [];
        const maxPagesToShow = 5; // Max number of page number links to show
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            // Less than or equal to maxPagesToShow pages, show all
            startPage = 1;
            endPage = totalPages;
        } else {
            // More pages, calculate start and end pages with ellipsis potential
            const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
            const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;

            if (currentPage <= maxPagesBeforeCurrent) {
                // Near the start
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                // Near the end
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                // Somewhere in the middle
                startPage = currentPage - maxPagesBeforeCurrent;
                endPage = currentPage + maxPagesAfterCurrent;
            }
        }

        // Add "First" button
        items.push(
            <Pagination.First
                key="first"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
            />
        );

        // Add "Prev" button
        items.push(
            <Pagination.Prev
                key="prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
            />
        );

        // Add Ellipsis if needed at the beginning
        if (startPage > 1) {
             items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)}>{1}</Pagination.Item>);
             if (startPage > 2) {
                 items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
             }
        }


        // Add page number buttons
        for (let number = startPage; number <= endPage; number++) {
            items.push(
                <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    onClick={() => handlePageChange(number)}
                >
                    {number}
                </Pagination.Item>
            );
        }

        // Add Ellipsis if needed at the end
         if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
            }
            items.push(<Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>);
        }


        // Add "Next" button
        items.push(
            <Pagination.Next
                key="next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            />
        );

         // Add "Last" button
        items.push(
            <Pagination.Last
                key="last"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
            />
        );


        return <Pagination className="justify-content-center">{items}</Pagination>;
    };


    return (
        <Container fluid className="py-4 px-md-4 main-content">
            <h2 className="fw-bold text-primary mb-4 d-flex align-items-center">
                <FaReceipt className="me-3" /> Invoices
            </h2>

            {/* --- Search and Filter Card --- */}
            <Card className="shadow-sm mb-4 border-light">
                {/* ... (keep existing search/filter card content) ... */}
                 <Card.Body>
                    <Row className="g-3">
                        <Col md={6} lg={7}>
                            <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control
                                    placeholder="Search by Invoice #, Customer, Vehicle..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={6} lg={5}>
                            <InputGroup>
                                <InputGroup.Text><FaFilter /></InputGroup.Text>
                                <Form.Select
                                    aria-label="Filter by status"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Overdue">Overdue</option>
                                </Form.Select>
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* --- Invoices Table Card --- */}
            <Card className="shadow-sm border-light">
                <Card.Header className="bg-light fw-bold d-flex justify-content-between align-items-center">
                    {/* Updated header to show counts */}
                    <span>
                         Finalized Invoices (Showing {currentInvoices.length > 0 ? startIndex + 1 : 0}
                         - {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length})
                    </span>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover striped className="mb-0">
                            <thead className="table-light">
                               {/* ... (keep existing table headers) ... */}
                               <tr>
                                    <th>Invoice #</th>
                                    <th>Date Issued</th>
                                    <th>Customer</th>
                                    <th>Vehicle</th>
                                    <th className="text-end">Amount</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Map over currentInvoices (the sliced data) */}
                                {currentInvoices.length > 0 ? (
                                    currentInvoices.map(inv => (
                                        <tr key={inv.id}>
                                           {/* ... (keep existing table cell rendering) ... */}
                                            <td>
                                                <Link to={`/invoice/${inv.id}/view`}>
                                                    {inv.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td>{inv.dateIssued}</td>
                                            <td>{inv.customerName}</td>
                                            <td>{inv.vehicleModel}</td>
                                            <td className="text-end">{formatCurrency(inv.grandTotal)}</td>
                                            <td className="text-center">{getStatusBadge(inv.status)}</td>
                                            <td className="text-center">
                                                <Link
                                                    to={`/invoice/${inv.id}/view`}
                                                    className="btn btn-outline-info btn-sm me-1"
                                                    title="View Invoice"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    title="Print Invoice"
                                                    onClick={() => handlePrintInvoice(inv.id)}
                                                >
                                                    <FaPrint />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-4">
                                            {invoices.length === 0 ? "No invoices available." : "No invoices found matching your criteria."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
                 {/* Conditionally render Pagination if more than one page */}
                 {totalPages > 1 && (
                    <Card.Footer className="bg-light border-0 pt-3 pb-1">
                        {renderPaginationItems()}
                    </Card.Footer>
                 )}
            </Card>
        </Container>
    );
};

export default InvoicesPage;