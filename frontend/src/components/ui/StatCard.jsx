import React from 'react';

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  iconColor = 'indigo',
  className = ''
}) => {
  return (
    <div className={`stat-card ${className}`}>
      <div>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {subtext && <div className="stat-card-subtext">{subtext}</div>}
      </div>

      {Icon && (
        <div className={`stat-card-icon-wrapper stat-card-icon-${iconColor}`}>
          <Icon />
        </div>
      )}
    </div>
  );
};

export default StatCard;
