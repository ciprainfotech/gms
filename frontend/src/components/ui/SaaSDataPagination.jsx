import React from 'react';
import { Form } from 'react-bootstrap';
import { FaAngleLeft, FaAngleRight, FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6';

const SaaSDataPagination = ({
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = ''
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  // Generate page numbers range for clean display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={`d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 p-3 bg-light bg-opacity-50 border-top rounded-bottom-4 ${className}`}>
      {/* Left Info & Rows Per Page Selector */}
      <div className="d-flex align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted text-xs fw-semibold">Rows per page:</span>
          <Form.Select
            size="sm"
            value={pageSize}
            onChange={(e) => {
              if (onPageSizeChange) onPageSizeChange(Number(e.target.value));
              if (onPageChange) onPageChange(1);
            }}
            className="form-select-sm border-secondary-subtle fw-bold rounded-3"
            style={{ width: '75px', padding: '0.2rem 0.5rem', fontSize: '12px' }}
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Form.Select>
        </div>

        <span className="text-muted small">
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
        </span>
      </div>

      {/* Right Page Controls */}
      <div className="d-flex align-items-center gap-1">
        <button
          className="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="First Page"
        >
          <FaAnglesLeft size={11} />
        </button>

        <button
          className="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1 me-1"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
        >
          <FaAngleLeft size={11} />
        </button>

        {getPageNumbers().map(pageNum => (
          <button
            key={pageNum}
            className={`btn btn-sm rounded-3 px-3 py-1 fw-bold me-1 ${pageNum === currentPage ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ fontSize: '12px' }}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        ))}

        <button
          className="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1 ms-1"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
        >
          <FaAngleRight size={11} />
        </button>

        <button
          className="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
        >
          <FaAnglesRight size={11} />
        </button>
      </div>
    </div>
  );
};

export default SaaSDataPagination;
