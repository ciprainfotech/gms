import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const toastConfig = {
  success: { icon: FaCheckCircle,  className: 'toast-success' },
  error:   { icon: FaExclamationCircle, className: 'toast-error' },
  warning: { icon: FaExclamationTriangle, className: 'toast-warning' },
  info:    { icon: FaInfoCircle,    className: 'toast-info' },
};

const CustomToast = ({ type = 'info', title, message, onClose, duration = 4500 }) => {
  const [exiting, setExiting] = useState(false);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`custom-toast ${config.className}`}
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateX(110%)' : 'translateX(0)',
        transition: 'all 0.2s ease'
      }}
    >
      <div className="custom-toast-icon">
        <Icon size={20} />
      </div>
      <div className="custom-toast-body">
        {title && <div className="custom-toast-title">{title}</div>}
        <div className="custom-toast-message">{message}</div>
      </div>
      <button className="custom-toast-close" onClick={handleClose} aria-label="Close">
        <FaTimes />
      </button>
      {duration && (
        <div 
          className="custom-toast-progress" 
          style={{ animationDuration: `${duration}ms` }} 
        />
      )}
    </div>
  );
};

/** Wrapper that positions toasts bottom-right */
export const ToastContainer = ({ children }) => (
  <div className="custom-toast-container">{children}</div>
);

export default CustomToast;
