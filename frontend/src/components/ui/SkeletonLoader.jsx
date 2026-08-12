import React from 'react';

const SkeletonLine = ({ height = '16px', width = '100%', radius = '4px', className = '' }) => (
  <div
    className={`skeleton-box ${className}`}
    style={{ height, width, borderRadius: radius, marginBottom: '0.5rem' }}
  />
);

const SkeletonTableRow = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, idx) => (
      <td key={idx}>
        <SkeletonLine height="18px" width={idx === 0 ? '70%' : '90%'} />
      </td>
    ))}
  </tr>
);

const SkeletonTable = ({ rows = 5, columns = 5 }) => (
  <div className="data-table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, idx) => (
            <th key={idx}>
              <SkeletonLine height="14px" width="60%" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, idx) => (
          <SkeletonTableRow key={idx} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

const SkeletonStatGrid = ({ count = 4 }) => (
  <div className="stat-card-grid">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="stat-card">
        <div style={{ flex: 1 }}>
          <SkeletonLine height="12px" width="50%" />
          <SkeletonLine height="28px" width="80%" />
          <SkeletonLine height="12px" width="40%" />
        </div>
        <div className="skeleton-box" style={{ width: '48px', height: '48px', borderRadius: '10px' }} />
      </div>
    ))}
  </div>
);

const SkeletonLoader = {
  Line: SkeletonLine,
  TableRow: SkeletonTableRow,
  Table: SkeletonTable,
  StatGrid: SkeletonStatGrid,
};

export default SkeletonLoader;
