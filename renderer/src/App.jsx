import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

console.log('📱 App.jsx loaded!');

const getStyles = theme => {
  const t =
    theme === 'light'
      ? {
          container: {
            background: 'linear-gradient(145deg, #f0f0f5 0%, #e0e0ea 50%, #d0d0e0 100%)',
            color: '#1a1a2e',
          },
          card: { background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)' },
          textPreview: { color: '#333' },
          summaryText: { color: '#1a1a2e' },
          input: {
            background: 'rgba(255,255,255,0.8)',
            color: '#1a1a2e',
            border: '1px solid rgba(0,0,0,0.1)',
          },
          dropdown: { background: '#fff', border: '1px solid rgba(0,0,0,0.1)', color: '#1a1a2e' },
        }
      : {
          container: {
            background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
            color: '#e4e4e7',
          },
          card: {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          },
          textPreview: { color: 'rgba(255,255,255,0.6)' },
          summaryText: { color: 'rgba(255,255,255,0.9)' },
          input: {
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          dropdown: {
            background: 'rgba(20,20,35,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e4e4e7',
          },
        };

  return {
    container: {
      minHeight: '100vh',
      background: t.container.background,
      color: t.container.color,
      padding: '16px 24px 20px',
      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    logoIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
    },
    title: {
      fontSize: '1rem',
      fontWeight: 700,
      margin: 0,
      background: 'linear-gradient(90deg, #f8fafc, #c4b5fd)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.5px',
    },
    modeTabs: {
      display: 'flex',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 10,
      padding: 3,
      gap: 2,
    },
    tab: active => ({
      padding: '6px 14px',
      borderRadius: 7,
      border: 'none',
      background: active ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'transparent',
      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
      fontSize: '0.75rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
    menuBtn: {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: 8,
      padding: '6px 10px',
      cursor: 'pointer',
      fontSize: '1rem',
      color: '#fff',
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: 4,
      minWidth: 180,
      background: t.dropdown.background,
      border: t.dropdown.border,
      borderRadius: 10,
      padding: 6,
      zIndex: 100,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    },
    dropdownSection: {
      padding: '6px 8px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    dropdownItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: '0.8rem',
      transition: 'all 0.15s',
    },
    dropdownLabel: {
      fontSize: '0.65rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: 'rgba(255,255,255,0.3)',
      padding: '4px 8px 2px',
    },
    providerBtn: active => ({
      padding: '4px 8px',
      borderRadius: 5,
      border: 'none',
      fontSize: '0.65rem',
      fontWeight: 600,
      cursor: 'pointer',
      background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)',
      color: '#fff',
      textTransform: 'uppercase',
    }),
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
    inputWrapper: {
      position: 'relative',
      marginTop: 12,
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      paddingRight: 40,
      borderRadius: 10,
      border: t.input.border,
      background: t.input.background,
      color: t.input.color,
      fontSize: '0.85rem',
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    sendBtn: {
      position: 'absolute',
      right: 6,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 28,
      height: 28,
      borderRadius: 8,
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      transition: 'all 0.2s ease',
    },
    answerCard: {
      marginTop: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: 10,
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
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 10,
      borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    toggleBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      background: 'rgba(99,102,241,0.2)',
      borderRadius: 20,
      fontSize: '0.65rem',
      color: 'rgba(255,255,255,0.6)',
    },
    helpBtn: {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: 6,
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '0.7rem',
      color: 'rgba(255,255,255,0.5)',
    },
    shortcutsPopup: {
      position: 'absolute',
      bottom: '100%',
      right: 0,
      marginBottom: 6,
      background: 'rgba(20,20,35,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: '0.7rem',
      color: 'rgba(255,255,255,0.7)',
      minWidth: 160,
    },
    shortcutRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '3px 0',
    },
  };
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [provider, setProvider] = useState('ollama');
  const [clipboardText, setClipboardText] = useState('');
  const [activeWindow, setActiveWindow] = useState('');
  const [visible, setVisible] = useState(true);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('summarize');
  const [followUps, setFollowUps] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [lastClipboardText, setLastClipboardText] = useState('');
  const [activePanel, setActivePanel] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [settings, setSettings] = useState({});
  const [autoStart, setAutoStart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [qaError, setQaError] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [hotkeys, setHotkeys] = useState({});
  const [editingHotkey, setEditingHotkey] = useState(null);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const styles = getStyles(theme);

  const commands = [
    {
      id: 'summarize',
      label: 'Summarize Clipboard',
      icon: '📋',
      action: () => setMode('summarize'),
    },
    { id: 'ask', label: 'Ask Question', icon: '❓', action: () => setMode('qa') },
    {
      id: 'history',
      label: 'View History',
      icon: '📜',
      action: () => {
        handlePanelToggle('history');
        setShowCommandPalette(false);
      },
    },
    {
      id: 'bookmarks',
      label: 'View Bookmarks',
      icon: '🔖',
      action: () => {
        handlePanelToggle('bookmarks');
        setShowCommandPalette(false);
      },
    },
    {
      id: 'analysis',
      label: 'Analyze Text',
      icon: '📊',
      action: () => {
        handlePanelToggle('analysis');
        setShowCommandPalette(false);
      },
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: '⚙️',
      action: () => {
        handlePanelToggle('settings');
        setShowCommandPalette(false);
      },
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Theme',
      icon: theme === 'dark' ? '☀️' : '🌙',
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        setShowCommandPalette(false);
      },
    },
    {
      id: 'pause',
      label: 'Pause Monitoring',
      icon: '⏸️',
      action: () => {
        window.electronAPI.clipboardPause();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'resume',
      label: 'Resume Monitoring',
      icon: '▶️',
      action: () => {
        window.electronAPI.clipboardResume();
        setShowCommandPalette(false);
      },
    },
    {
      id: 'export-json',
      label: 'Export as JSON',
      icon: '📦',
      action: () => {
        showToast('Exported successfully', 'success');
        setShowCommandPalette(false);
      },
    },
    {
      id: 'export-html',
      label: 'Export as HTML',
      icon: '🌐',
      action: () => {
        showToast('Exported successfully', 'success');
        setShowCommandPalette(false);
      },
    },
    {
      id: 'quit',
      label: 'Quit Application',
      icon: '🚪',
      action: () => {
        window.electronAPI.quit();
      },
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const handlePanelToggle = panel => {
    setActivePanel(activePanel === panel ? null : panel);
    if (activePanel !== panel) {
      if (panel === 'settings' && !settings.theme) {
        window.electronAPI.getSettings().then(setSettings);
        window.electronAPI.getAutoStart().then(enabled => setAutoStart(enabled));
        window.electronAPI.getHotkeys().then(setHotkeys);
      }
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      body { background: #1e1e2e; }
      input::placeholder { color: rgba(255,255,255,0.3); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleClipboard = t => {
      setSummaryError('');
      try {
        if (t !== lastClipboardText) {
          setLastClipboardText(t);
          if (conversation.length === 0) {
            setSummary('');
            setAnswer('');
            setFollowUps([]);
          }
        }
        setClipboardText(t);
        if (mode === 'summarize' && conversation.length === 0) {
          setLoading(true);
          window.electronAPI.summarize(t);
        }
      } catch (err) {
        setLoading(false);
        setSummaryError('Failed to process clipboard content. Please try again.');
        showToast('Something went wrong', 'error');
      }
    };

    const handleSummary = ({ text, summary, followUps = [], error }) => {
      if (error) {
        setLoading(false);
        setSummaryError('Failed to generate summary. Please try again.');
        showToast('Something went wrong', 'error');
        return;
      }
      setClipboardText(text);
      setSummary(summary);
      setFollowUps(followUps);
      setLoading(false);
    };

    const handleActiveWindow = w => setActiveWindow(w);

    window.electronAPI.removeAllListeners?.('clipboard');
    window.electronAPI.removeAllListeners?.('summary-event');
    window.electronAPI.removeAllListeners?.('active-window');

    window.electronAPI.onClipboard(handleClipboard);
    window.electronAPI.onSummary(handleSummary);
    window.electronAPI.onActiveWindow(handleActiveWindow);

    const onKey = e => {
      if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.electronAPI.removeAllListeners?.('clipboard');
      window.electronAPI.removeAllListeners?.('summary-event');
      window.electronAPI.removeAllListeners?.('active-window');
    };
  }, [mode]);

  useEffect(() => {
    setClipboardText('');
    setSummary('');
    setQuestion('');
    setAnswer('');
    setLoading(false);
    setAnswerLoading(false);
    setFollowUps([]);
    setConversation([]);
    setSummaryError('');
    setQaError('');
  }, [mode]);

  useEffect(() => {
    if (!window.electronAPI?.setSize) return;
    const contentHeight = document.body.scrollHeight;
    const height = Math.max(200, Math.min(contentHeight + 40, 700));
    window.electronAPI.setSize({ width: 820, height });
  }, [
    clipboardText,
    summary,
    answer,
    mode,
    followUps,
    conversation,
    answerLoading,
    loading,
    activePanel,
  ]);

  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (showCommandPalette && e.key === 'Escape') {
        setShowCommandPalette(false);
      }
      if (showCommandPalette && e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      }
      if (showCommandPalette && e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(i => Math.max(i - 1, 0));
      }
      if (showCommandPalette && e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedCommandIndex]?.action();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, selectedCommandIndex, filteredCommands]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAnswer('');
    setQaError('');
    setAnswerLoading(true);
    try {
      const res = await window.electronAPI.qa(clipboardText, question);
      setAnswer(res || 'No answer received.');
    } catch (err) {
      setQaError('Unable to get an answer. Please check your connection and try again.');
      showToast('Something went wrong', 'error');
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleFollowUp = async q => {
    const cleanQ = q.replace(/^[.\d\-\*\)\s]+/, '').trim();
    setQuestion(cleanQ);
    setAnswer('');
    setFollowUps([]);
    setQaError('');
    setAnswerLoading(true);
    try {
      const res = await window.electronAPI.qa(clipboardText, q);
      const followData = await window.electronAPI.summarize(
        `User Question: ${q}\n\nAnswer: ${res}`
      );
      setConversation(prev => [
        ...prev,
        { question: cleanQ, answer: res, followUps: followData?.followUps || [] },
      ]);
      setFollowUps(followData?.followUps || []);
    } catch (err) {
      setQaError('Unable to process your question. Please try again.');
      showToast('Something went wrong', 'error');
    } finally {
      setAnswerLoading(false);
    }
  };

  const PanelContent = () => {
    if (activePanel === 'analysis') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ ...styles.card, marginTop: 12 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#34d399' }}>
              📊 Analysis
            </span>
            <button
              onClick={() => setActivePanel(null)}
              style={{ ...styles.menuBtn, padding: '4px 8px', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </div>
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
            <div
              style={{
                textAlign: 'center',
                padding: 16,
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.8rem',
              }}
            >
              Click 📊 in menu to analyze
            </div>
          )}
        </motion.div>
      );
    }

    if (activePanel === 'bookmarks') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ ...styles.card, marginTop: 12 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>
              🔖 Bookmarks
            </span>
            <button
              onClick={() => setActivePanel(null)}
              style={{ ...styles.menuBtn, padding: '4px 8px', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: 16,
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.8rem',
            }}
          >
            Click ⭐ on a summary to bookmark
          </div>
        </motion.div>
      );
    }

    if (activePanel === 'history') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ ...styles.card, marginTop: 12 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#a5b4fc' }}>
              📜 History
            </span>
            <button
              onClick={() => setActivePanel(null)}
              style={{ ...styles.menuBtn, padding: '4px 8px', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: 16,
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.8rem',
            }}
          >
            Your conversation history appears here
          </div>
        </motion.div>
      );
    }

    if (activePanel === 'settings') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ ...styles.card, marginTop: 12 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.9rem',
                background: 'linear-gradient(90deg, #f8fafc, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ⚙️ Settings
            </span>
            <button
              onClick={() => setActivePanel(null)}
              style={{ ...styles.menuBtn, padding: '4px 8px', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Theme
              </label>
              <select
                value={settings.theme || theme}
                onChange={e => {
                  setSettings({ ...settings, theme: e.target.value });
                  setTheme(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <option value="dark" style={{ background: '#1e1e2e' }}>
                  🌙 Dark
                </option>
                <option value="light" style={{ background: '#1e1e2e' }}>
                  ☀️ Light
                </option>
              </select>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                💾 Auto Save
              </span>
              <button
                onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  background: settings.autoSave
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s',
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: settings.autoSave ? 19 : 3,
                    transition: 'all 0.3s',
                  }}
                />
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                🚀 Start with Windows
              </span>
              <button
                onClick={async () => {
                  const newValue = !autoStart;
                  setAutoStart(newValue);
                  await window.electronAPI.setAutoStart(newValue);
                }}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  background: autoStart
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s',
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: autoStart ? 19 : 3,
                    transition: 'all 0.3s',
                  }}
                />
              </button>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Window Opacity
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={Math.round((settings.windowOpacity || 1) * 100)}
                  onChange={e => {
                    const opacity = parseInt(e.target.value) / 100;
                    setSettings({ ...settings, windowOpacity: opacity });
                    window.electronAPI.setOpacity(opacity);
                  }}
                  style={{ flex: 1, accentColor: '#6366f1' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', minWidth: 35 }}>
                  {Math.round((settings.windowOpacity || 1) * 100)}%
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                📌 Always On Top
              </span>
              <button
                onClick={() => {
                  const newValue = !settings.alwaysOnTop;
                  setSettings({ ...settings, alwaysOnTop: newValue });
                  window.electronAPI.setAlwaysOnTop(newValue);
                }}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  background: settings.alwaysOnTop
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s',
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: settings.alwaysOnTop ? 19 : 3,
                    transition: 'all 0.3s',
                  }}
                />
              </button>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Window Size
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['small', 'medium', 'large', 'wide'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => window.electronAPI.setPreset(preset)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Keyboard Shortcuts
                </label>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                Press Ctrl+K for command palette
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'grid',
                  gap: 6,
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {[
                  { key: 'toggle', label: 'Toggle Overlay' },
                  { key: 'resetPosition', label: 'Reset Position' },
                  { key: 'moveUp', label: 'Move Up' },
                  { key: 'moveDown', label: 'Move Down' },
                  { key: 'moveLeft', label: 'Move Left' },
                  { key: 'moveRight', label: 'Move Right' },
                  { key: 'quit', label: 'Quit' },
                  { key: 'snapTopLeft', label: 'Snap Top Left' },
                  { key: 'snapTopCenter', label: 'Snap Top Center' },
                  { key: 'snapTopRight', label: 'Snap Top Right' },
                  { key: 'snapBottomLeft', label: 'Snap Bottom Left' },
                  { key: 'snapBottomCenter', label: 'Snap Bottom Center' },
                  { key: 'snapBottomRight', label: 'Snap Bottom Right' },
                  { key: 'snapCenter', label: 'Snap Center' },
                  { key: 'snapReset', label: 'Snap Reset' },
                  { key: 'commandPalette', label: 'Command Palette' },
                ].map(item => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 6,
                      border:
                        editingHotkey === item.key
                          ? '1px solid rgba(99,102,241,0.5)'
                          : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setEditingHotkey(item.key);
                      const newHotkey = prompt(
                        `Enter new hotkey for ${item.label}:`,
                        hotkeys[item.key] || ''
                      );
                      if (newHotkey) {
                        const newHotkeys = { ...hotkeys, [item.key]: newHotkey };
                        setHotkeys(newHotkeys);
                        window.electronAPI.saveHotkeys(newHotkeys);
                        showToast('Hotkey updated', 'success');
                      }
                      setEditingHotkey(null);
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: '#a5b4fc',
                        background: 'rgba(99,102,241,0.15)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontFamily: "'Cascadia Code', 'Consolas', monospace",
                      }}
                    >
                      {(hotkeys[item.key] || '').replace('CommandOrControl', 'Ctrl')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={async () => {
                await window.electronAPI.saveSettings(settings);
                if (Object.keys(hotkeys).length > 0) {
                  await window.electronAPI.saveHotkeys(hotkeys);
                }
                showToast('Settings saved', 'success');
                setActivePanel(null);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
              }}
            >
              💾 Save
            </button>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      {showCommandPalette && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
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
          }}
          onClick={() => setShowCommandPalette(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              width: 480,
              maxHeight: '60vh',
              background: theme === 'dark' ? 'rgba(30,30,45,0.98)' : 'rgba(255,255,255,0.98)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <input
                type="text"
                placeholder="Type a command..."
                value={commandQuery}
                onChange={e => {
                  setCommandQuery(e.target.value);
                  setSelectedCommandIndex(0);
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(99,102,241,0.4)',
                  background: 'rgba(255,255,255,0.05)',
                  color: theme === 'dark' ? '#fff' : '#1a1a2e',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
              {filteredCommands.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setShowCommandPalette(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background:
                      idx === selectedCommandIndex ? 'rgba(99,102,241,0.2)' : 'transparent',
                    border:
                      idx === selectedCommandIndex
                        ? '1px solid rgba(99,102,241,0.3)'
                        : '1px solid transparent',
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{cmd.icon}</span>
                  <span
                    style={{ color: theme === 'dark' ? '#e4e4e7' : '#1a1a2e', fontSize: '0.85rem' }}
                  >
                    {cmd.label}
                  </span>
                </div>
              ))}
              {filteredCommands.length === 0 && (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.85rem',
                  }}
                >
                  No commands found
                </div>
              )}
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            {toasts.length > 0 && (
              <div style={{ position: 'fixed', bottom: 60, right: 16, zIndex: 1000 }}>
                {toasts.map(toast => (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    style={{
                      background:
                        toast.type === 'success'
                          ? '#22c55e'
                          : toast.type === 'error'
                            ? '#ef4444'
                            : toast.type === 'warning'
                              ? '#f59e0b'
                              : '#3b82f6',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 8,
                      marginBottom: 8,
                      fontSize: '0.8rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    {toast.message}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={styles.container}
        >
          <div style={{ WebkitAppRegion: 'drag', height: 8 }} />

          <div style={styles.header}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>✨</div>
              <h3 style={styles.title}>Zero-Click</h3>
            </div>
            <div style={styles.modeTabs}>
              {[
                { key: 'summarize', label: 'Summarize' },
                { key: 'qa', label: 'Ask' },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  style={styles.tab(mode === m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={styles.menuBtn} title="Menu">
                ⋮
              </button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.dropdown}
                >
                  <div style={styles.dropdownSection}>
                    <div style={styles.dropdownLabel}>Provider</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['ollama', 'gemini', 'mock'].map(p => (
                        <button
                          key={p}
                          onClick={async () => {
                            await window.electronAPI.setProvider(p);
                            setProvider(p);
                            setShowMenu(false);
                          }}
                          style={styles.providerBtn(provider === p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={styles.dropdownSection}>
                    <div
                      onClick={() => {
                        setTheme(theme === 'dark' ? 'light' : 'dark');
                        setShowMenu(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                  </div>
                  <div style={{ padding: '4px 6px' }}>
                    <div style={styles.dropdownLabel}>Tools</div>
                    {[
                      { key: 'analysis', icon: '📊', label: 'Analysis' },
                      { key: 'bookmarks', icon: '🔖', label: 'Bookmarks' },
                      { key: 'history', icon: '📜', label: 'History' },
                    ].map(item => (
                      <div
                        key={item.key}
                        onClick={() => {
                          handlePanelToggle(item.key);
                          setShowMenu(false);
                        }}
                        style={styles.dropdownItem}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{ padding: '4px 6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      onClick={() => {
                        handlePanelToggle('settings');
                        setShowMenu(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <PanelContent />

          {mode === 'summarize' && (
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ fontSize: 12 }}
                  >
                    ⟳
                  </motion.span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    Analyzing...
                  </span>
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.summaryBox}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#c4b5fd',
                      marginBottom: 8,
                    }}
                  >
                    📋 Summary
                  </div>
                  <div style={styles.summaryText}>
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>

                  {followUps.length > 0 && (
                    <div style={styles.followUpsContainer}>
                      <div style={styles.followUpLabel}>
                        <span>💡</span> Suggested
                      </div>
                      {followUps.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleFollowUp(q)}
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={styles.answerCard}
                    >
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
                      <ReactMarkdown>{answer}</ReactMarkdown>
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
          )}

          {conversation.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ marginTop: 10 }}
            >
              <div style={{ color: '#818cf8', fontSize: '0.75rem', marginBottom: 6 }}>
                💬 {item.question}
              </div>
              <div style={styles.answerCard}>
                <ReactMarkdown>{item.answer}</ReactMarkdown>
              </div>
            </motion.div>
          ))}

          {mode === 'qa' && (
            <>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Ask about the text..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAsk()}
                  style={styles.input}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }}
                />
                <button style={styles.sendBtn} onClick={handleAsk}>
                  ➤
                </button>
              </div>

              {answerLoading && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  style={{
                    marginTop: 12,
                    color: '#a5b4fc',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                  }}
                >
                  💭 Thinking...
                </motion.div>
              )}

              {qaError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8,
                    color: '#fca5a5',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                  }}
                >
                  ⚠️ {qaError}
                </motion.div>
              )}

              {answer && !answerLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.answerCard}
                >
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </motion.div>
              )}
            </>
          )}

          <div style={styles.footer}>
            <span style={styles.toggleBadge}>Ctrl+Shift+Space: Toggle</span>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                onMouseEnter={() => setShowShortcuts(true)}
                onMouseLeave={() => setShowShortcuts(false)}
                style={styles.helpBtn}
              >
                ⌘
              </button>
              {showShortcuts && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.shortcutsPopup}
                >
                  <div style={styles.shortcutRow}>
                    <span>Ctrl+K</span>
                    <span>Commands</span>
                  </div>
                  <div style={styles.shortcutRow}>
                    <span>Ctrl+Shift+Space</span>
                    <span>Toggle</span>
                  </div>
                  <div style={styles.shortcutRow}>
                    <span>Ctrl+Alt+R</span>
                    <span>Reset</span>
                  </div>
                  <div style={styles.shortcutRow}>
                    <span>Ctrl+Alt+X</span>
                    <span>Quit</span>
                  </div>
                  <div style={styles.shortcutRow}>
                    <span>Ctrl+Alt+Arrows</span>
                    <span>Move</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
