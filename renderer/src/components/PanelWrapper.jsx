import React, { useState, useEffect } from 'react';
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

export function AnalysisPanel({
  activePanel,
  reducedMotion,
  onClose,
  theme = 'dark',
  clipboardText = '',
}) {
  const styles = getPanelWrapperStyles(theme);
  const [textInput, setTextInput] = useState(clipboardText);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clipboardText && !textInput) {
      setTextInput(clipboardText);
    }
  }, [clipboardText]);

  const handleAnalyze = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text to analyze');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await window.electronAPI.analyzeText(textInput);
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (activePanel !== 'analysis') return null;

  const getInputStyle = () => ({
    width: '100%',
    minHeight: 80,
    padding: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.8rem',
    fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
    resize: 'vertical',
    outline: 'none',
  });

  const getButtonStyle = () => ({
    marginTop: 8,
    padding: '8px 16px',
    background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.8rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
  });

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
      <textarea
        value={textInput}
        onChange={e => setTextInput(e.target.value)}
        placeholder="Paste or type text to analyze..."
        style={getInputStyle()}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={getButtonStyle()}
        onMouseEnter={e => {
          if (!loading) {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
          }
        }}
        onMouseLeave={e => {
          if (!loading) {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze Text'}
      </button>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 8,
            padding: '8px 10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: '0.75rem',
          }}
        >
          ⚠️ {error}
        </motion.div>
      )}

      {analysis && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 12 }}
        >
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
        </motion.div>
      )}

      {!analysis && !loading && (
        <div style={styles.emptyState}>Enter text above and click Analyze</div>
      )}
    </PanelWrapper>
  );
}

export function BookmarksPanel({ activePanel, reducedMotion, onClose, theme = 'dark' }) {
  const styles = getPanelWrapperStyles(theme);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activePanel === 'bookmarks') {
      loadBookmarks();
    }
  }, [activePanel]);

  const loadBookmarks = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await window.electronAPI.getBookmarks();
      setBookmarks(result || []);
    } catch (err) {
      setError('Failed to load bookmarks');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    try {
      await window.electronAPI.deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      setError('Failed to delete bookmark');
    }
  };

  if (activePanel !== 'bookmarks') return null;

  const getItemStyle = () => ({
    padding: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    marginBottom: 8,
  });

  const getDeleteBtnStyle = () => ({
    padding: '4px 8px',
    background: 'rgba(239,68,68,0.2)',
    border: 'none',
    borderRadius: 4,
    color: '#fca5a5',
    fontSize: '0.7rem',
    cursor: 'pointer',
  });

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
      {loading && (
        <div style={{ textAlign: 'center', padding: 12, color: 'rgba(255,255,255,0.5)' }}>
          Loading...
        </div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '8px 10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: '0.75rem',
            marginBottom: 8,
          }}
        >
          ⚠️ {error}
        </motion.div>
      )}

      {!loading && bookmarks.length === 0 && (
        <div style={styles.emptyState}>No bookmarks yet. Click ⭐ on a summary to bookmark</div>
      )}

      {!loading && bookmarks.length > 0 && (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {bookmarks.map((bookmark, idx) => (
            <motion.div
              key={bookmark.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={getItemStyle()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bookmark.summary?.substring(0, 60) || bookmark.title || 'Bookmark'}
                    {(bookmark.summary?.length || 0) > 60 ? '...' : ''}
                  </div>
                  {bookmark.timestamp && (
                    <div
                      style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}
                    >
                      {new Date(bookmark.timestamp).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  style={getDeleteBtnStyle()}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(239,68,68,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(239,68,68,0.2)';
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PanelWrapper>
  );
}

export function HistoryPanel({ activePanel, reducedMotion, onClose, theme = 'dark' }) {
  const styles = getPanelWrapperStyles(theme);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activePanel === 'history') {
      loadHistory();
    }
  }, [activePanel]);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      let result = await window.electronAPI.getHistory();
      if (!result || result.length === 0) {
        result = await window.electronAPI.getSavedConversations();
      }
      setHistory(result || []);
    } catch (err) {
      setError('Failed to load history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return;
    try {
      await window.electronAPI.clearHistory();
      setHistory([]);
    } catch (err) {
      setError('Failed to clear history');
    }
  };

  if (activePanel !== 'history') return null;

  const getItemStyle = () => ({
    padding: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    marginBottom: 8,
  });

  const getClearBtnStyle = () => ({
    padding: '6px 12px',
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 6,
    color: '#fca5a5',
    fontSize: '0.7rem',
    cursor: 'pointer',
  });

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
      {loading && (
        <div style={{ textAlign: 'center', padding: 12, color: 'rgba(255,255,255,0.5)' }}>
          Loading...
        </div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '8px 10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: '0.75rem',
            marginBottom: 8,
          }}
        >
          ⚠️ {error}
        </motion.div>
      )}

      {!loading && history.length === 0 && (
        <div style={styles.emptyState}>No conversation history yet</div>
      )}

      {!loading && history.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              onClick={handleClearHistory}
              style={getClearBtnStyle()}
              onMouseEnter={e => {
                e.target.style.background = 'rgba(239,68,68,0.3)';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'rgba(239,68,68,0.15)';
              }}
            >
              Clear All
            </button>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {history.map((item, idx) => (
              <motion.div
                key={item.id || item.timestamp || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={getItemStyle()}
              >
                <div style={{ fontSize: '0.8rem', color: '#fff' }}>
                  {item.summary?.substring(0, 80) ||
                    item.question?.substring(0, 40) ||
                    'Conversation'}
                  {(item.summary?.length || 0) > 80 || (item.question?.length || 0) > 40
                    ? '...'
                    : ''}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {item.timestamp
                    ? new Date(item.timestamp).toLocaleString()
                    : item.date
                      ? new Date(item.date).toLocaleString()
                      : 'Unknown time'}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </PanelWrapper>
  );
}
