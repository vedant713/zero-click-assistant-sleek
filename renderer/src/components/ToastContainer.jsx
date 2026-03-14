import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getToastStyles = () => {
  return {
    container: {
      position: 'fixed',
      bottom: 60,
      right: 16,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    toast: type => ({
      background:
        type === 'success'
          ? '#22c55e'
          : type === 'error'
            ? '#ef4444'
            : type === 'warning'
              ? '#f59e0b'
              : '#3b82f6',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: 8,
      fontSize: '0.8rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }),
  };
};

export default function ToastContainer({ toasts, reducedMotion = false }) {
  const styles = getToastStyles();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={reducedMotion ? false : { opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? false : { opacity: 0, x: 50 }}
            transition={
              reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }
            }
            style={styles.toast(toast.type)}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
