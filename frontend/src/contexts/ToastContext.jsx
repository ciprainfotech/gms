import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomToast, { ToastContainer } from '../components/CustomToast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, title = 'Success') => {
    return showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((message, title = 'Error') => {
    return showToast({ type: 'error', title, message });
  }, [showToast]);

  const warning = useCallback((message, title = 'Warning') => {
    return showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((message, title = 'Notice') => {
    return showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <CustomToast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
