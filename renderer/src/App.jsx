import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      try {
        func(...args);
      } catch (error) {
        console.error('Debounced function error:', error);
      }
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

import Header from './components/Header';
import SummaryPanel from './components/SummaryPanel';
import QAPanel from './components/QAPanel';
import SettingsPanel from './components/SettingsPanel';
import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/ToastContainer';
import { AnalysisPanel, BookmarksPanel, HistoryPanel } from './components/PanelWrapper';

console.log('📱 App.jsx loaded!');

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 20,
            background: '#1e1e2e',
            color: '#fff',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: '1rem', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const getStyles = (theme, highContrast = false) => {
  const hc = highContrast
    ? {
        light: {
          container: { background: '#ffffff', color: '#000000' },
          card: { background: '#ffffff', border: '2px solid #000000' },
          textPreview: { color: '#000000' },
          summaryText: { color: '#000000' },
          input: { background: '#ffffff', color: '#000000', border: '2px solid #000000' },
          dropdown: { background: '#ffffff', border: '2px solid #000000', color: '#000000' },
        },
        dark: {
          container: { background: '#000000', color: '#ffffff' },
          card: { background: '#000000', border: '2px solid #ffffff' },
          textPreview: { color: '#ffffff' },
          summaryText: { color: '#ffffff' },
          input: { background: '#000000', color: '#ffffff', border: '2px solid #ffffff' },
          dropdown: { background: '#000000', border: '2px solid #ffffff', color: '#ffffff' },
        },
      }
    : null;

  const t =
    theme === 'light'
      ? hc?.light || {
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
      : hc?.dark || {
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
  const [providerStatus, setProviderStatus] = useState('connecting');
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

  const toastTimeoutsRef = useRef([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    toastTimeoutsRef.current.push(timeoutId);
    return id;
  };

  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const styles = getStyles(theme, settings.highContrast);
  const reducedMotion = settings.reducedMotion;

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

  const handleCloseSettings = async () => {
    await window.electronAPI.saveSettings(settings);
    if (Object.keys(hotkeys).length > 0) {
      await window.electronAPI.saveHotkeys(hotkeys);
    }
    setActivePanel(null);
  };

  const handleSettingsChange = async newSettings => {
    setSettings(newSettings);
    if (window.electronAPI?.saveSettings) {
      await window.electronAPI.saveSettings(newSettings);
    }
  };

  const handleHotkeysChange = async newHotkeys => {
    setHotkeys(newHotkeys);
    if (window.electronAPI?.saveHotkeys) {
      await window.electronAPI.saveHotkeys(newHotkeys);
    }
  };

  const handleExportSettings = async () => {
    const data = await window.electronAPI.exportSettings();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zero-click-settings.json';
      a.click();
      showToast('Settings exported', 'success');
    }
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async ev => {
          try {
            const data = JSON.parse(ev.target.result);
            const success = await window.electronAPI.importSettings(data);
            if (success) {
              showToast('Settings imported', 'success');
            } else {
              showToast('Import failed', 'error');
            }
          } catch (err) {
            showToast('Invalid file', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
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
      .drag-region { -webkit-app-region: drag; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleClipboard = t => {
      if (!t || typeof t !== 'string' || t.trim().length === 0) return;
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
          const textToSummarize = t.length > 50000 ? t.substring(0, 50000) : t;
          window.electronAPI.summarize(textToSummarize);
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
    window.electronAPI.removeAllListeners?.('provider-status');

    window.electronAPI.onClipboard(handleClipboard);
    window.electronAPI.onSummary(handleSummary);
    window.electronAPI.onActiveWindow(handleActiveWindow);
    window.electronAPI.onProviderStatus(status => {
      setProviderStatus(status);
    });

    const onKey = e => {
      if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners?.('clipboard');
        window.electronAPI.removeAllListeners?.('summary-event');
        window.electronAPI.removeAllListeners?.('active-window');
        window.electronAPI.removeAllListeners?.('provider-status');
      }
    };
  }, [mode]);

  useEffect(() => {
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

  const debouncedSetSize = useCallback(
    debounce(size => {
      window.electronAPI?.setSize(size);
    }, 300),
    []
  );

  useEffect(() => {
    if (!window.electronAPI?.setSize) return;
    const contentHeight = document.body.scrollHeight;
    const height = Math.max(200, Math.min(contentHeight + 40, 700));
    debouncedSetSize({ width: 820, height });
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
    debouncedSetSize,
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
      let followData = null;
      try {
        followData = await window.electronAPI.summarize(`User Question: ${q}\n\nAnswer: ${res}`);
      } catch (followErr) {
        console.warn('Follow-up summary failed:', followErr);
      }
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

  const handleBookmark = async (summaryText, conversationData) => {
    try {
      const label = `Summary - ${new Date().toLocaleDateString()}`;
      await window.electronAPI.bookmarkConversation(conversationData, summaryText, label);
      showToast('Bookmark saved!', 'success');
    } catch (err) {
      console.error('Failed to save bookmark:', err);
      showToast('Failed to save bookmark', 'error');
    }
  };

  return (
    <ErrorBoundary>
      <AnimatePresence reducedMotion={reducedMotion}>
        {showCommandPalette && (
          <CommandPalette
            show={showCommandPalette}
            setShow={setShowCommandPalette}
            commandQuery={commandQuery}
            setCommandQuery={setCommandQuery}
            selectedCommandIndex={selectedCommandIndex}
            setSelectedCommandIndex={setSelectedCommandIndex}
            filteredCommands={filteredCommands}
            theme={theme}
            reducedMotion={reducedMotion}
          />
        )}
        {visible && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
            transition={
              reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }
            }
            style={styles.container}
          >
            <div className="drag-region" style={{ height: 8 }} />

            <Header
              theme={theme}
              setTheme={setTheme}
              mode={mode}
              setMode={setMode}
              showMenu={showMenu}
              setShowMenu={setShowMenu}
              provider={provider}
              setProvider={setProvider}
              providerStatus={providerStatus}
              handlePanelToggle={handlePanelToggle}
            />

            {activePanel === 'settings' ? (
              <SettingsPanel
                settings={settings}
                setSettings={handleSettingsChange}
                theme={theme}
                setTheme={setTheme}
                autoStart={autoStart}
                hotkeys={hotkeys}
                setHotkeys={handleHotkeysChange}
                editingHotkey={editingHotkey}
                setEditingHotkey={setEditingHotkey}
                showToast={showToast}
                onClose={handleCloseSettings}
                onExport={handleExportSettings}
                onImport={handleImportSettings}
                reducedMotion={reducedMotion}
              />
            ) : (
              <>
                <AnalysisPanel
                  clipboardText={clipboardText}
                  activePanel={activePanel}
                  reducedMotion={reducedMotion}
                  onClose={() => setActivePanel(null)}
                  theme={theme}
                />
                <BookmarksPanel
                  activePanel={activePanel}
                  reducedMotion={reducedMotion}
                  onClose={() => setActivePanel(null)}
                  theme={theme}
                />
                <HistoryPanel
                  activePanel={activePanel}
                  reducedMotion={reducedMotion}
                  onClose={() => setActivePanel(null)}
                  theme={theme}
                />

                {mode === 'summarize' && (
                  <>
                    <SummaryPanel
                      clipboardText={clipboardText}
                      activeWindow={activeWindow}
                      loading={loading}
                      summary={summary}
                      followUps={followUps}
                      summaryError={summaryError}
                      onFollowUpClick={handleFollowUp}
                      theme={theme}
                      reducedMotion={reducedMotion}
                      answerLoading={answerLoading}
                      answer={answer}
                      conversation={conversation}
                      onBookmark={handleBookmark}
                    />

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
                        <div
                          style={{
                            marginTop: 10,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10,
                            padding: 10,
                          }}
                        >
                          {item.answer}
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}

                {mode === 'qa' && (
                  <QAPanel
                    clipboardText={clipboardText}
                    question={question}
                    setQuestion={setQuestion}
                    answer={answer}
                    answerLoading={answerLoading}
                    qaError={qaError}
                    onAsk={handleAsk}
                    theme={theme}
                    reducedMotion={reducedMotion}
                  />
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
      <ToastContainer toasts={toasts} reducedMotion={reducedMotion} />
    </ErrorBoundary>
  );
}
