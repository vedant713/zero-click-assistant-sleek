import React from 'react';
import { motion } from 'framer-motion';

const getModePanelStyles = theme => {
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
    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: 8,
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.15)',
      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
      color: isDark ? '#fff' : '#333',
      fontSize: '0.8rem',
      marginBottom: 12,
      fontFamily: 'inherit',
    },
    select: {
      padding: '8px 12px',
      borderRadius: 8,
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.15)',
      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
      color: isDark ? '#fff' : '#333',
      fontSize: '0.8rem',
      marginBottom: 12,
    },
    btn: {
      padding: '10px 20px',
      borderRadius: 8,
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff',
      fontSize: '0.8rem',
      fontWeight: 600,
      cursor: 'pointer',
      width: '100%',
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
    label: {
      fontSize: '0.7rem',
      color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
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
  };
};

const LANGUAGES = [
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Hindi',
  'Arabic',
  'Russian',
  'Dutch',
];

export default function ModePanel({
  mode,
  title,
  icon,
  clipboardText,
  result,
  loading,
  error,
  onAction,
  targetLanguage,
  setTargetLanguage,
  theme = 'dark',
  reducedMotion = false,
}) {
  const styles = getModePanelStyles(theme);
  const [customLang, setCustomLang] = React.useState(targetLanguage || 'Spanish');

  const showLanguageSelect = mode === 'translate';

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }}
      style={styles.card}
    >
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
      </div>

      {clipboardText && (
        <div style={{ marginBottom: 12 }}>
          <div style={styles.label}>Clipboard Text</div>
          <div
            style={{
              ...styles.result,
              maxHeight: 120,
              overflow: 'auto',
              fontSize: '0.75rem',
            }}
          >
            {clipboardText.substring(0, 500)}
            {clipboardText.length > 500 ? '...' : ''}
          </div>
        </div>
      )}

      {showLanguageSelect && (
        <div style={{ marginBottom: 12 }}>
          <div style={styles.label}>Target Language</div>
          <select
            value={customLang}
            onChange={e => setCustomLang(e.target.value)}
            style={styles.select}
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={() => onAction(customLang)}
        disabled={loading || !clipboardText}
        style={{
          ...styles.btn,
          opacity: loading || !clipboardText ? 0.6 : 1,
          cursor: loading || !clipboardText ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⏳ Processing...' : `✨ ${title.split(' ')[1] || 'Run'}`}
      </button>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {loading && <div style={styles.loading}>🤖 AI is thinking...</div>}

      {result && !loading && (
        <div style={styles.result}>
          <div style={styles.label}>Result</div>
          <div style={styles.resultText}>{result}</div>
        </div>
      )}
    </motion.div>
  );
}
