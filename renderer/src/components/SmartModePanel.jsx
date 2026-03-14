import React from 'react';
import { motion } from 'framer-motion';

const getSmartPanelStyles = theme => {
  const isDark = theme === 'dark';
  return {
    card: {
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: '0.85rem',
      fontWeight: 600,
      color: isDark ? 'rgba(255,255,255,0.9)' : '#1a1a2e',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
      borderRadius: 20,
      fontSize: '0.65rem',
      color: '#a5b4fc',
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: '0.7rem',
      color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    clipboardPreview: {
      padding: 12,
      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
      borderRadius: 8,
      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
      fontSize: '0.75rem',
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
      maxHeight: 100,
      overflow: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    },
    actionBtn: {
      padding: '10px 8px',
      borderRadius: 8,
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
      color: isDark ? '#e4e4e7' : '#1a1a2e',
      fontSize: '0.7rem',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      transition: 'all 0.2s ease',
    },
    confidenceDot: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: '#22c55e',
    },
    mainBtn: {
      padding: '12px 20px',
      borderRadius: 8,
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff',
      fontSize: '0.85rem',
      fontWeight: 600,
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    result: {
      marginTop: 16,
      padding: 12,
      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
      borderRadius: 8,
      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
    },
    resultText: {
      fontSize: '0.85rem',
      lineHeight: 1.6,
      color: isDark ? 'rgba(255,255,255,0.9)' : '#1a1a2e',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
    error: {
      color: '#ef4444',
      fontSize: '0.8rem',
      marginTop: 8,
      padding: 8,
      background: 'rgba(239,68,68,0.1)',
      borderRadius: 6,
    },
    loading: {
      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
      fontSize: '0.8rem',
      textAlign: 'center',
      padding: 20,
    },
    shortcut: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: '0.65rem',
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
      marginTop: 8,
    },
    kbd: {
      padding: '2px 6px',
      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderRadius: 4,
      fontSize: '0.6rem',
      fontFamily: 'monospace',
    },
  };
};

const ACTION_ICONS = {
  summarize: '📋',
  explainCode: '💻',
  meetingNotes: '📝',
  fixGrammar: '✏️',
  sentiment: '😊',
  keywords: '🔑',
  reply: '💬',
  title: '📌',
};

const ACTION_LABELS = {
  summarize: 'Summarize',
  explainCode: 'Explain Code',
  meetingNotes: 'Meeting Notes',
  fixGrammar: 'Fix Grammar',
  sentiment: 'Sentiment',
  keywords: 'Keywords',
  reply: 'Quick Reply',
  title: 'Generate Title',
};

export default function SmartModePanel({
  clipboardText,
  result,
  loading,
  error,
  onSmartProcess,
  detectedContentType,
  suggestedActions = [],
  onQuickAction,
  theme = 'dark',
  reducedMotion = false,
}) {
  const styles = getSmartPanelStyles(theme);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }}
      style={styles.card}
    >
      <div style={styles.header}>
        <span style={styles.title}>✨ Smart Mode</span>
        {detectedContentType && <span style={styles.badge}>Detected: {detectedContentType}</span>}
      </div>

      {clipboardText && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Clipboard Content</div>
          <div style={styles.clipboardPreview}>
            {clipboardText.substring(0, 400)}
            {clipboardText.length > 400 ? '...' : ''}
          </div>
        </div>
      )}

      {suggestedActions.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Suggested Actions</div>
          <div style={styles.actionsGrid}>
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onQuickAction(action.action)}
                disabled={loading}
                style={styles.actionBtn}
                title={`Confidence: ${Math.round(action.confidence * 100)}%`}
              >
                <span style={{ fontSize: '1.1rem' }}>{ACTION_ICONS[action.action] || '✨'}</span>
                <span>{ACTION_LABELS[action.action] || action.action}</span>
                <div
                  style={{
                    ...styles.confidenceDot,
                    background:
                      action.confidence > 0.7
                        ? '#22c55e'
                        : action.confidence > 0.5
                          ? '#eab308'
                          : '#ef4444',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onSmartProcess}
        disabled={loading || !clipboardText}
        style={{
          ...styles.mainBtn,
          opacity: loading || !clipboardText ? 0.6 : 1,
          cursor: loading || !clipboardText ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⏳ Processing...' : '✨ Auto-Process'}
      </button>

      <div style={styles.shortcut}>
        Press <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd> for quick
        processing
      </div>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {loading && <div style={styles.loading}>🤖 AI is analyzing and processing...</div>}

      {result && !loading && (
        <div style={styles.result}>
          <div style={styles.sectionTitle}>Smart Result</div>
          <div style={styles.resultText}>{result}</div>
        </div>
      )}
    </motion.div>
  );
}
