import React from 'react';
import { motion } from 'framer-motion';

const getHeaderStyles = theme => {
  const t =
    theme === 'light'
      ? {
          dropdown: { background: '#fff', border: '1px solid rgba(0,0,0,0.1)', color: '#1a1a2e' },
        }
      : {
          dropdown: {
            background: 'rgba(20,20,35,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e4e4e7',
          },
        };

  return {
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
    tab: (active, theme) => ({
      padding: '6px 14px',
      borderRadius: 7,
      border: 'none',
      background: active ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'transparent',
      color: active
        ? theme === 'dark'
          ? '#fff'
          : '#fff'
        : theme === 'dark'
          ? 'rgba(255,255,255,0.5)'
          : 'rgba(0,0,0,0.5)',
      fontSize: '0.75rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
    menuBtn: theme => ({
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      border: 'none',
      borderRadius: 8,
      padding: '6px 10px',
      cursor: 'pointer',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: theme === 'dark' ? '#fff' : '#1a1a2e',
      transition: 'all 0.2s ease',
    }),
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
    dropdownSection: theme => ({
      padding: '6px 8px',
      borderBottom:
        theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
    }),
    dropdownItem: theme => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: '0.8rem',
      color: theme === 'dark' ? '#e4e4e7' : '#1a1a2e',
      transition: 'all 0.15s',
    }),
    dropdownLabel: theme => ({
      fontSize: '0.65rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
      padding: '4px 8px 2px',
    }),
    providerBtn: (active, theme) => ({
      padding: '4px 8px',
      borderRadius: 5,
      border: 'none',
      fontSize: '0.65rem',
      fontWeight: 600,
      cursor: 'pointer',
      background: active
        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
        : theme === 'dark'
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(0,0,0,0.1)',
      color: '#fff',
      textTransform: 'uppercase',
    }),
  };
};

export default function Header({
  theme,
  setTheme,
  mode,
  setMode,
  showMenu,
  setShowMenu,
  provider,
  setProvider,
  providerStatus = 'connecting',
  handlePanelToggle,
}) {
  const styles = getHeaderStyles(theme);

  const handleProviderChange = async p => {
    if (window.electronAPI) {
      await window.electronAPI.setProvider(p);
    }
    setProvider(p);
    setShowMenu(false);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setShowMenu(false);
  };

  const handleToolClick = key => {
    handlePanelToggle(key);
    setShowMenu(false);
  };

  return (
    <div style={styles.header}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>✨</div>
        <h3 style={styles.title}>Zero-Click</h3>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background:
              providerStatus === 'online'
                ? '#22c55e'
                : providerStatus === 'connecting'
                  ? '#eab308'
                  : '#ef4444',
            marginLeft: 4,
            boxShadow: `0 0 6px ${providerStatus === 'online' ? '#22c55e' : providerStatus === 'connecting' ? '#eab308' : '#ef4444'}`,
          }}
          title={
            providerStatus === 'online'
              ? 'Connected'
              : providerStatus === 'connecting'
                ? 'Connecting...'
                : 'Offline'
          }
        />
      </div>
      <div style={styles.modeTabs}>
        {[
          { key: 'summarize', label: 'Summarize' },
          { key: 'qa', label: 'Ask' },
          { key: 'smart', label: '✨ Smart' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={styles.tab(mode === m.key, theme)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowMenu(!showMenu)} style={styles.menuBtn(theme)} title="Menu">
          <span style={{ marginRight: 4 }}>More</span> ⋮
        </button>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.dropdown}
          >
            <div style={styles.dropdownSection(theme)}>
              <div style={styles.dropdownLabel(theme)}>Provider</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['ollama', 'gemini', 'mock'].map(p => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    style={styles.providerBtn(provider === p, theme)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.dropdownSection(theme)}>
              <div onClick={handleThemeToggle} style={styles.dropdownItem(theme)}>
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </div>
            <div style={{ padding: '4px 6px' }}>
              <div style={styles.dropdownLabel(theme)}>Tools</div>
              {[
                { key: 'analysis', icon: '📊', label: 'Analysis' },
                { key: 'bookmarks', icon: '🔖', label: 'Bookmarks' },
                { key: 'history', icon: '📜', label: 'History' },
              ].map(item => (
                <div
                  key={item.key}
                  onClick={() => handleToolClick(item.key)}
                  style={styles.dropdownItem(theme)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '4px 6px' }}>
              <div style={styles.dropdownLabel(theme)}>AI Modes</div>
              {[
                { key: 'translate', icon: '🌐', label: 'Translate' },
                { key: 'explainCode', icon: '💻', label: 'Explain Code' },
                { key: 'fixGrammar', icon: '✏️', label: 'Fix Grammar' },
                { key: 'sentiment', icon: '😊', label: 'Sentiment' },
                { key: 'keywords', icon: '🔑', label: 'Keywords' },
                { key: 'reply', icon: '💬', label: 'Quick Reply' },
                { key: 'title', icon: '📝', label: 'Generate Title' },
                { key: 'meetingNotes', icon: '📋', label: 'Meeting Notes' },
                { key: 'smart', icon: '✨', label: 'Smart Mode' },
              ].map(item => (
                <div
                  key={item.key}
                  onClick={() => {
                    setMode(item.key);
                    setShowMenu(false);
                  }}
                  style={styles.dropdownItem(theme)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: '4px 6px',
                borderTop:
                  theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div onClick={() => handleToolClick('settings')} style={styles.dropdownItem(theme)}>
                <span>⚙️</span>
                <span>Settings</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
