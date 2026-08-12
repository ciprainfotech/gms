import React from 'react';

const PageShell = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = ''
}) => {
  return (
    <div className={`page-shell ${className}`}>
      {(title || actions) && (
        <div className="page-header-row">
          <div className="page-title-group">
            {title && (
              <h1 className="page-title">
                {Icon && <Icon className="page-title-icon" />}
                {title}
              </h1>
            )}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>

          {actions && <div className="page-header-actions">{actions}</div>}
        </div>
      )}

      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageShell;
