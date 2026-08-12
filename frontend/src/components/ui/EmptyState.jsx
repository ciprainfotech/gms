import React from 'react';
import { FaInbox } from 'react-icons/fa';

const EmptyState = ({
  icon: Icon = FaInbox,
  title = 'No Data Found',
  message = 'There are no records to display at this time.',
  action,
  className = ''
}) => {
  return (
    <div className={`empty-state-card ${className}`}>
      <div className="empty-state-icon">
        <Icon />
      </div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-message">{message}</div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
