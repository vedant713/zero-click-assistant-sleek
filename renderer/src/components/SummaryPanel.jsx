import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const LinkRenderer = ({ href, children }) => {
  const handleClick = e => {
    e.preventDefault();
    if (href) {
      if (window.electronAPI?.shellOpenExternal) {
        window.electronAPI.shellOpenExternal(href);
      } else if (window.open) {
        window.open(href, '_blank');
      }
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      type="button"
      style={{
        color: '#818cf8',
        cursor: 'pointer',
        textDecoration: 'underline',
      }}
    >
      {children}
    </a>
  );
};

const markdownComponents = {
  a: LinkRenderer,
};

const getSummaryPanelStyles = theme => {
  const t =
    theme === 'light'
      ? {
          card: { background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)' },
          textPreview: { color: '#333' },
          summaryText: { color: '#1a1a2e' },
        }
      : {
          card: {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          },
          textPreview: { color: 'rgba(255,255,255,0.6)' },
          summaryText: { color: 'rgba(255,255,255,0.9)' },
        };

  return {
    card: {
      background: t.card.background,
      border: t.card.border,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    cardLabel: {
      fontSize: '0.65rem',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: 'rgba(255,255,255,0.4)',
      fontWeight: 600,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: '#22c55e',
      boxShadow: '0 0 6px #22c55e',
    },
    textPreview: {
      fontSize: '0.8rem',
      color: t.textPreview.color,
      lineHeight: 1.5,
      maxHeight: 80,
      overflow: 'hidden',
      fontFamily: "'Cascadia Code', 'Consolas', monospace",
    },
    summaryBox: {
      background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
    },
    summaryText: {
      fontSize: '0.85rem',
      lineHeight: 1.6,
      color: t.summaryText.color,
    },
    followUpsContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: '1px solid rgba(255,255,255,0.08)',
    },
    followUpLabel: {
      fontSize: '0.65rem',
      color: '#34d399',
      fontWeight: 600,
      marginBottom: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    },
    followUpBtn: {
      display: 'block',
      width: '100%',
      padding: '8px 10px',
      marginBottom: 4,
      background: 'rgba(52,211,153,0.08)',
      border: '1px solid rgba(52,211,153,0.15)',
      borderRadius: 8,
      color: '#6ee7b7',
      fontSize: '0.75rem',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    answerCard: {
      marginTop: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: 10,
    },
    bookmarkBtn: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      padding: '2px 6px',
      borderRadius: 4,
      transition: 'all 0.2s ease',
      opacity: 0.6,
    },
    emptyState: {
      textAlign: 'center',
      padding: '20px 12px',
      color: 'rgba(255,255,255,0.35)',
    },
    emptyIcon: {
      fontSize: 32,
      marginBottom: 8,
      opacity: 0.5,
    },
  };
};

export default function SummaryPanel({
  clipboardText,
  activeWindow,
  loading,
  summary,
  followUps,
  summaryError,
  onFollowUpClick,
  theme = 'dark',
  reducedMotion = false,
  answerLoading = false,
  answer = '',
  conversation = [],
  onBookmark,
}) {
  const styles = getSummaryPanelStyles(theme);

  return (
    <>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardLabel}>Clipboard</span>
          <div style={styles.statusDot} />
        </div>
        <pre style={styles.textPreview}>
          {clipboardText || activeWindow || 'Copy any text to get started...'}
        </pre>
      </div>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ fontSize: 14, color: '#a5b4fc' }}
            >
              ⟳
            </motion.span>
            <span style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>Analyzing...</span>
          </div>
          <div
            style={{
              height: 3,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: 2,
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}

      {summaryError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 10,
            padding: '10px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: '0.8rem',
          }}
        >
          ⚠️ {summaryError}
        </motion.div>
      )}

      {summary && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.summaryBox}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#c4b5fd',
              }}
            >
              📋 Summary
            </div>
            {summary && onBookmark && (
              <button
                onClick={() => onBookmark(summary, conversation)}
                style={styles.bookmarkBtn}
                onMouseEnter={e => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.target.style.opacity = '0.6';
                  e.target.style.transform = 'scale(1)';
                }}
                title="Bookmark this summary"
              >
                ⭐
              </button>
            )}
          </div>
          <div style={styles.summaryText}>
            <ReactMarkdown components={markdownComponents}>{summary}</ReactMarkdown>
          </div>

          {followUps && followUps.length > 0 && (
            <div style={styles.followUpsContainer}>
              <div style={styles.followUpLabel}>
                <span>💡</span> Suggested
              </div>
              {followUps.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onFollowUpClick(q)}
                  style={styles.followUpBtn}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(52,211,153,0.15)';
                    e.target.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(52,211,153,0.08)';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  → {q}
                </button>
              ))}
            </div>
          )}

          {answerLoading && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ marginTop: 10, color: '#a5b4fc', fontSize: '0.75rem' }}
            >
              💭 Generating...
            </motion.div>
          )}

          {answer && !answerLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.answerCard}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#818cf8',
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                💬 Answer
              </div>
              <ReactMarkdown components={markdownComponents}>{answer}</ReactMarkdown>
            </motion.div>
          )}
        </motion.div>
      )}

      {!clipboardText && !loading && !summary && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <div style={{ fontSize: '0.85rem' }}>Copy any text to summarize</div>
        </div>
      )}
    </>
  );
}
