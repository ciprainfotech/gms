import React from 'react';

const statusConfigMap = {
  // Job sheet statuses
  'waiting': { label: 'Waiting', variant: 'warning' },
  'in progress': { label: 'In Progress', variant: 'primary' },
  'completed': { label: 'Completed', variant: 'success' },
  'invoiced': { label: 'Invoiced', variant: 'info' },
  'cancelled': { label: 'Cancelled', variant: 'danger' },

  // Payment statuses
  'paid': { label: 'Paid', variant: 'success' },
  'partial': { label: 'Partial', variant: 'warning' },
  'unpaid': { label: 'Unpaid', variant: 'danger' },
  'overdue': { label: 'Overdue', variant: 'danger' },

  // Generic statuses
  'active': { label: 'Active', variant: 'success' },
  'suspended': { label: 'Suspended', variant: 'danger' },
  'low stock': { label: 'Low Stock', variant: 'danger' },
};

const StatusBadge = ({ status, customLabel, showDot = true, className = '' }) => {
  const normalizedKey = (status || '').toString().toLowerCase().trim();
  const config = statusConfigMap[normalizedKey] || {
    label: status || 'Unknown',
    variant: 'secondary'
  };

  const label = customLabel || config.label;

  return (
    <span className={`status-badge status-badge-${config.variant} ${className}`}>
      {showDot && <span className="status-badge-dot" />}
      {label}
    </span>
  );
};

export default StatusBadge;
