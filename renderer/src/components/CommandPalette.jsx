import React from 'react';
import { motion } from 'framer-motion';

const getCommandPaletteStyles = theme => {
  const isDark = theme === 'dark';
  return {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh',
      zIndex: 1000,
    },
    modal: {
      width: 480,
      maxHeight: '60vh',
      background: isDark ? 'rgba(30,30,45,0.98)' : 'rgba(255,255,255,0.98)',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    inputContainer: {
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 8,
      border: '1px solid rgba(99,102,241,0.4)',
      background: 'rgba(255,255,255,0.05)',
      color: isDark ? '#fff' : '#1a1a2e',
      fontSize: '0.9rem',
      outline: 'none',
    },
    commandList: {
      overflowY: 'auto',
      flex: 1,
      padding: '6px',
    },
    commandItem: selected => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      borderRadius: 8,
      cursor: 'pointer',
      background: selected ? 'rgba(99,102,241,0.2)' : 'transparent',
      border: selected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
      transition: 'all 0.1s',
    }),
    commandIcon: {
      fontSize: '1.1rem',
    },
    commandLabel: {
      color: isDark ? '#e4e4e7' : '#1a1a2e',
      fontSize: '0.85rem',
    },
    noResults: {
      padding: '20px',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.4)',
      fontSize: '0.85rem',
    },
    footer: {
      padding: '8px 16px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.65rem',
      color: 'rgba(255,255,255,0.4)',
    },
  };
};

export default function CommandPalette({
  show,
  setShow,
  commandQuery,
  setCommandQuery,
  selectedCommandIndex,
  setSelectedCommandIndex,
  filteredCommands,
  onExecute,
  theme = 'dark',
  reducedMotion = false,
}) {
  const styles = getCommandPaletteStyles(theme);

  const handleQueryChange = e => {
    setCommandQuery(e.target.value);
    setSelectedCommandIndex(0);
  };

  const handleCommandClick = command => {
    if (onExecute) {
      onExecute(command);
    } else {
      command.action();
    }
    setShow(false);
  };

  const handleOverlayClick = () => {
    setShow(false);
  };

  const handleModalClick = e => {
    e.stopPropagation();
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.overlay}
      onClick={handleOverlayClick}
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? false : { opacity: 0, y: -20, scale: 0.95 }}
        transition={
          reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }
        }
        style={styles.modal}
        onClick={handleModalClick}
      >
        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Type a command..."
            value={commandQuery}
            onChange={handleQueryChange}
            autoFocus
            style={styles.input}
          />
        </div>
        <div style={styles.commandList}>
          {filteredCommands.map((cmd, idx) => (
            <div
              key={cmd.id}
              onClick={() => handleCommandClick(cmd)}
              style={styles.commandItem(idx === selectedCommandIndex)}
            >
              <span style={styles.commandIcon}>{cmd.icon}</span>
              <span style={styles.commandLabel}>{cmd.label}</span>
            </div>
          ))}
          {filteredCommands.length === 0 && <div style={styles.noResults}>No commands found</div>}
        </div>
        <div style={styles.footer}>
          <span>↑↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
