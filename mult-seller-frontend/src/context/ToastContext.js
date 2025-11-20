import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ show: false, title: '', message: '', type: 'success' });

  const showToast = useCallback((opts) => {
    setToast({ show: true, title: opts.title || '', message: opts.message || '', type: opts.type || 'success' });
    setTimeout(() => setToast(t => ({ ...t, show: false })), opts.duration || 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast show={toast.show} title={toast.title} message={toast.message} type={toast.type} />
    </ToastContext.Provider>
  );
};



