import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const FilterBar = ({
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  children,
  className = ''
}) => {
  return (
    <div className={`filter-bar-card ${className}`}>
      <div className="filter-bar-left">
        {onSearchChange && (
          <div className="search-pill-input">
            <FaSearch style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
            />
            {searchTerm && (
              <FaTimes
                style={{ color: 'var(--slate-400)', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => onSearchChange('')}
              />
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default FilterBar;
