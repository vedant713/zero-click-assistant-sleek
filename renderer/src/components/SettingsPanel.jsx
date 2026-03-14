import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const getSettingsStyles = theme => {
  return {
    card: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardTitle: {
      fontWeight: 700,
      fontSize: '0.9rem',
      background: 'linear-gradient(90deg, #f8fafc, #c4b5fd)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    menuBtn: {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: 8,
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      color: '#fff',
    },
    label: {
      display: 'block',
      fontSize: '0.65rem',
      color: 'rgba(255,255,255,0.5)',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    select: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
      color: '#fff',
      fontSize: '0.8rem',
      cursor: 'pointer',
    },
    toggleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.06)',
    },
    toggleLabel: {
      fontSize: '0.8rem',
      color: 'rgba(255,255,255,0.8)',
    },
    toggleBtn: active => ({
      width: 36,
      height: 20,
      borderRadius: 10,
      border: 'none',
      background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.3s',
    }),
    toggleDot: active => ({
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: '#fff',
      position: 'absolute',
      top: 3,
      left: active ? 19 : 3,
      transition: 'all 0.3s',
    }),
    rangeWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    range: {
      flex: 1,
      accentColor: '#6366f1',
    },
    rangeValue: {
      fontSize: '0.75rem',
      color: 'rgba(255,255,255,0.7)',
      minWidth: 35,
    },
    presetRow: {
      display: 'flex',
      gap: 6,
    },
    presetBtn: {
      flex: 1,
      padding: '6px 8px',
      borderRadius: 6,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
      color: '#fff',
      fontSize: '0.7rem',
      cursor: 'pointer',
      textTransform: 'capitalize',
    },
    shortcutSection: {
      marginTop: 8,
    },
    shortcutHint: {
      fontSize: '0.7rem',
      color: 'rgba(255,255,255,0.5)',
      marginTop: 4,
    },
    shortcutList: {
      marginTop: 8,
      display: 'grid',
      gap: 6,
      maxHeight: 180,
      overflowY: 'auto',
    },
    shortcutItem: editing => ({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 8px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 6,
      border: editing ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer',
    }),
    shortcutLabel: {
      fontSize: '0.75rem',
      color: 'rgba(255,255,255,0.7)',
    },
    shortcutKey: {
      fontSize: '0.65rem',
      color: '#a5b4fc',
      background: 'rgba(99,102,241,0.15)',
      padding: '2px 6px',
      borderRadius: 4,
      fontFamily: "'Cascadia Code', 'Consolas', monospace",
    },
    saveBtn: {
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
      width: '100%',
      marginTop: 12,
    },
    exportRow: {
      display: 'flex',
      gap: 8,
      marginTop: 12,
    },
    exportBtn: {
      flex: 1,
      padding: '8px 12px',
      borderRadius: 6,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
      color: '#fff',
      fontSize: '0.75rem',
      cursor: 'pointer',
    },
  };
};

const defaultHotkeys = [
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
];

export default function SettingsPanel({
  settings,
  setSettings,
  theme,
  setTheme,
  autoStart,
  hotkeys,
  setHotkeys,
  editingHotkey,
  setEditingHotkey,
  onSave,
  onExport,
  onImport,
  showToast,
  onClose,
  reducedMotion = false,
}) {
  const styles = getSettingsStyles(theme);

  const [hotkeyModalOpen, setHotkeyModalOpen] = useState(false);
  const [editingHotkeyLabel, setEditingHotkeyLabel] = useState('');
  const [editingHotkeyKey, setEditingHotkeyKey] = useState('');
  const [recordedHotkey, setRecordedHotkey] = useState('');

  useEffect(() => {
    if (!hotkeyModalOpen) return;

    const handleKeyDown = e => {
      e.preventDefault();
      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Meta');
      if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        parts.push(e.key.toUpperCase());
      }
      setRecordedHotkey(parts.join('+'));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkeyModalOpen]);

  const handleThemeChange = e => {
    const newTheme = e.target.value;
    setSettings({ ...settings, theme: newTheme });
    setTheme(newTheme);
  };

  const handleToggle = key => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleAutoStartToggle = async () => {
    const newValue = !autoStart;
    if (window.electronAPI?.setAutoStart) {
      await window.electronAPI.setAutoStart(newValue);
    }
    setSettings({ ...settings, autoStart: newValue });
  };

  const handleAlwaysOnTopToggle = () => {
    const newValue = !settings.alwaysOnTop;
    setSettings({ ...settings, alwaysOnTop: newValue });
    if (window.electronAPI?.setAlwaysOnTop) {
      window.electronAPI.setAlwaysOnTop(newValue);
    }
  };

  const handleOpacityChange = e => {
    const opacity = parseInt(e.target.value) / 100;
    setSettings({ ...settings, windowOpacity: opacity });
    if (window.electronAPI?.setOpacity) {
      window.electronAPI.setOpacity(opacity);
    }
  };

  const handlePresetClick = preset => {
    if (window.electronAPI?.setPreset) {
      window.electronAPI.setPreset(preset);
    }
  };

  const handleHotkeyClick = item => {
    setEditingHotkeyLabel(item.label);
    setEditingHotkeyKey(item.key);
    setRecordedHotkey(hotkeys[item.key] || '');
    setHotkeyModalOpen(true);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(settings);
    } else if (window.electronAPI?.saveSettings) {
      await window.electronAPI.saveSettings(settings);
      if (Object.keys(hotkeys).length > 0) {
        await window.electronAPI.saveHotkeys(hotkeys);
      }
    }
    showToast('Settings saved', 'success');
    if (onClose) onClose();
  };

  const handleExport = async () => {
    if (onExport) {
      onExport();
    } else if (window.electronAPI?.exportSettings) {
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
    }
  };

  const handleImport = () => {
    if (onImport) {
      onImport();
    } else {
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
              if (window.electronAPI?.importSettings) {
                const success = await window.electronAPI.importSettings(data);
                if (success) {
                  showToast('Settings imported', 'success');
                } else {
                  showToast('Import failed', 'error');
                }
              }
            } catch (err) {
              showToast('Invalid file', 'error');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
  };

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }}
      style={styles.card}
    >
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>⚙️ Settings</span>
        <button onClick={onClose} style={styles.menuBtn}>
          ✕
        </button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={styles.label}>Theme</label>
          <select
            value={settings.theme || theme}
            onChange={handleThemeChange}
            style={styles.select}
          >
            <option value="dark" style={{ background: '#1e1e2e' }}>
              🌙 Dark
            </option>
            <option value="light" style={{ background: '#1e1e2e' }}>
              ☀️ Light
            </option>
          </select>
        </div>

        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>🔴 High Contrast</span>
          <button
            onClick={() => handleToggle('highContrast')}
            style={styles.toggleBtn(settings.highContrast)}
          >
            <div style={styles.toggleDot(settings.highContrast)} />
          </button>
        </div>

        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>⏸️ Reduced Motion</span>
          <button
            onClick={() => handleToggle('reducedMotion')}
            style={styles.toggleBtn(settings.reducedMotion)}
          >
            <div style={styles.toggleDot(settings.reducedMotion)} />
          </button>
        </div>

        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>💾 Auto Save</span>
          <button
            onClick={() => handleToggle('autoSave')}
            style={styles.toggleBtn(settings.autoSave)}
          >
            <div style={styles.toggleDot(settings.autoSave)} />
          </button>
        </div>

        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>🚀 Start with Windows</span>
          <button onClick={handleAutoStartToggle} style={styles.toggleBtn(autoStart)}>
            <div style={styles.toggleDot(autoStart)} />
          </button>
        </div>

        <div>
          <label style={{ ...styles.label, marginBottom: 8 }}>Window Opacity</label>
          <div style={styles.rangeWrapper}>
            <input
              type="range"
              min="30"
              max="100"
              value={Math.round((settings.windowOpacity || 1) * 100)}
              onChange={handleOpacityChange}
              style={styles.range}
            />
            <span style={styles.rangeValue}>
              {Math.round((settings.windowOpacity || 1) * 100)}%
            </span>
          </div>
        </div>

        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>📌 Always On Top</span>
          <button onClick={handleAlwaysOnTopToggle} style={styles.toggleBtn(settings.alwaysOnTop)}>
            <div style={styles.toggleDot(settings.alwaysOnTop)} />
          </button>
        </div>

        <div>
          <label style={styles.label}>Window Size</label>
          <div style={styles.presetRow}>
            {['small', 'medium', 'large', 'wide'].map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                style={styles.presetBtn}
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
            <label style={styles.label}>Keyboard Shortcuts</label>
          </div>
          <div style={styles.shortcutHint}>Press Ctrl+K for command palette</div>
          <div style={styles.shortcutList}>
            {defaultHotkeys.map(item => (
              <div
                key={item.key}
                style={styles.shortcutItem(editingHotkey === item.key)}
                onClick={() => handleHotkeyClick(item)}
              >
                <span style={styles.shortcutLabel}>{item.label}</span>
                <span style={styles.shortcutKey}>
                  {(hotkeys[item.key] || '').replace('CommandOrControl', 'Ctrl')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} style={styles.saveBtn}>
          💾 Save
        </button>

        <div style={styles.exportRow}>
          <button onClick={handleExport} style={styles.exportBtn}>
            📤 Export
          </button>
          <button onClick={handleImport} style={styles.exportBtn}>
            📥 Import
          </button>
        </div>
      </div>

      {hotkeyModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setHotkeyModalOpen(false)}
        >
          <div
            style={{
              background: theme === 'dark' ? 'rgba(30,30,45,0.98)' : 'rgba(255,255,255,0.98)',
              borderRadius: 12,
              padding: 20,
              minWidth: 300,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>
              Set Hotkey for {editingHotkeyLabel}
            </div>
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                textAlign: 'center',
                marginBottom: 16,
                fontFamily: "'Cascadia Code', 'Consolas', monospace",
                fontSize: '0.85rem',
              }}
            >
              {recordedHotkey || 'Press any key combination...'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setHotkeyModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: theme === 'dark' ? '#fff' : '#1a1a2e',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (recordedHotkey) {
                    const newHotkeys = { ...hotkeys, [editingHotkeyKey]: recordedHotkey };
                    if (setHotkeys) {
                      setHotkeys(newHotkeys);
                    } else {
                      setSettings({ ...settings, hotkeys: newHotkeys });
                    }
                    showToast('Hotkey updated', 'success');
                  }
                  setHotkeyModalOpen(false);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
