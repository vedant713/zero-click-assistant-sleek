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
  const [showMenu, setShowMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const styles = getStyles(theme);

  const handlePanelToggle = panel => {
    setActivePanel(activePanel === panel ? null : panel);
    if (activePanel !== panel) {
      if (panel === 'settings' && !settings.theme) {
        window.electronAPI.getSettings().then(setSettings);
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
    };

    const handleSummary = ({ text, summary, followUps = [] }) => {
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

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAnswer('');
    setAnswerLoading(true);
    try {
      const res = await window.electronAPI.qa(clipboardText, question);
      setAnswer(res || 'No answer received.');
    } catch (err) {
      setAnswer('Failed to generate an answer.');
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleFollowUp = async q => {
    const cleanQ = q.replace(/^[.\d\-\*\)\s]+/, '').trim();
    setQuestion(cleanQ);
    setAnswer('');
    setFollowUps([]);
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
      setAnswer('Failed to generate answer.');
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
            <button
              onClick={async () => {
                await window.electronAPI.saveSettings(settings);
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
