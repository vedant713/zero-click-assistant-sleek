import React from 'react';
import { motion } from 'framer-motion';

const getPanelWrapperStyles = theme => {
  const isDark = theme === 'dark';
  return {
    wrapper: {
      marginTop: 12,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    title: {
      fontWeight: 700,
      fontSize: '0.9rem',
    },
    closeBtn: {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: 8,
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      color: '#fff',
    },
    content: {
      padding: 12,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
    },
    emptyState: {
      textAlign: 'center',
      padding: 16,
      color: 'rgba(255,255,255,0.4)',
      fontSize: '0.8rem',
    },
  };
};

export default function PanelWrapper({
  activePanel,
  reducedMotion = false,
  onClose,
  children,
  theme = 'dark',
  title = '',
  icon = '',
  color = '#fff',
}) {
  const styles = getPanelWrapperStyles(theme);

  if (!activePanel) return null;

  const getTitleStyle = () => ({
    ...styles.title,
    color: color,
  });

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }}
      style={styles.wrapper}
    >
      <div style={styles.header}>
        <span style={getTitleStyle()}>
          {icon} {title}
        </span>
        <button onClick={onClose} style={styles.closeBtn}>
          ✕
        </button>
      </div>
      <div style={styles.content}>{children}</div>
    </motion.div>
  );
}

export function AnalysisPanel({ analysis, activePanel, reducedMotion, onClose, theme = 'dark' }) {
  const styles = getPanelWrapperStyles(theme);

  if (activePanel !== 'analysis') return null;

  return (
    <PanelWrapper
      activePanel={activePanel}
      reducedMotion={reducedMotion}
      onClose={onClose}
      theme={theme}
      title="Analysis"
      icon="📊"
      color="#34d399"
    >
      {analysis ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { icon: '📝', label: 'Words', value: analysis.wordCount },
            { icon: '📄', label: 'Chars', value: analysis.charCount },
            { icon: '💬', label: 'Sentences', value: analysis.sentenceCount },
            { icon: '📊', label: 'Paragraphs', value: analysis.paragraphCount },
            {
              icon:
                analysis.sentiment === 'positive'
                  ? '😊'
                  : analysis.sentiment === 'negative'
                    ? '😞'
                    : '😐',
              label: 'Sentiment',
              value: analysis.sentiment,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: 8,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1rem', marginBottom: 2 }}>{item.icon}</div>
              <div
                style={{
                  fontSize: '0.6rem',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>Click 📊 in menu to analyze</div>
      )}
    </PanelWrapper>
  );
}

export function BookmarksPanel({ activePanel, reducedMotion, onClose, theme = 'dark' }) {
  const styles = getPanelWrapperStyles(theme);

  if (activePanel !== 'bookmarks') return null;

  return (
    <PanelWrapper
      activePanel={activePanel}
      reducedMotion={reducedMotion}
      onClose={onClose}
      theme={theme}
      title="Bookmarks"
      icon="🔖"
      color="#fbbf24"
    >
      <div style={styles.emptyState}>Click ⭐ on a summary to bookmark</div>
    </PanelWrapper>
  );
}

export function HistoryPanel({ activePanel, reducedMotion, onClose, theme = 'dark' }) {
  const styles = getPanelWrapperStyles(theme);

  if (activePanel !== 'history') return null;

  return (
    <PanelWrapper
      activePanel={activePanel}
      reducedMotion={reducedMotion}
      onClose={onClose}
      theme={theme}
      title="History"
      icon="📜"
      color="#a5b4fc"
    >
      <div style={styles.emptyState}>Your conversation history appears here</div>
    </PanelWrapper>
  );
}
