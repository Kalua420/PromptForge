import { useState, useCallback } from 'react';
import Toast from '../components/Toast.jsx';

/**
 * Custom hook for managing toast notifications
 * @returns {Object} - Toast state and control functions
 */
export const useToast = () => {
  const [toast, setToast] = useState({
    message: '',
    visible: false,
    type: 'info',
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, visible: true, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const ToastComponent = () => (
    <Toast {...toast} onClose={hideToast} />
  );

  return {
    toast,
    showToast,
    hideToast,
    ToastComponent,
  };
};
