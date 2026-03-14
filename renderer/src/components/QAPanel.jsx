import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const getQAPanelStyles = theme => {
  const t =
    theme === 'light'
      ? {
          input: {
            background: 'rgba(255,255,255,0.8)',
            color: '#1a1a2e',
            border: '1px solid rgba(0,0,0,0.1)',
          },
        }
      : {
          input: {
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        };

  return {
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
  };
};

export default function QAPanel({
  clipboardText,
  question,
  setQuestion,
  answer,
  answerLoading,
  qaError,
  onAsk,
  theme = 'dark',
  reducedMotion = false,
}) {
  const styles = getQAPanelStyles(theme);
  const [inputFocused, setInputFocused] = useState(false);

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !answerLoading) {
      onAsk();
    }
  };

  return (
    <>
      {clipboardText ? (
        <div
          style={{
            padding: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            marginBottom: 10,
            maxHeight: 60,
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
            📋 Analyzing:
          </div>
          <div
            style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}
          >
            {clipboardText.substring(0, 150)}
            {clipboardText.length > 150 ? '...' : ''}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 16,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            marginBottom: 10,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem',
          }}
        >
          📋 No text to ask about. Copy some text first.
        </div>
      )}
      <div style={styles.inputWrapper}>
        <input
          type="text"
          placeholder="Ask about the text..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          style={{
            ...styles.input,
            borderColor: inputFocused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
            background: inputFocused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          }}
        />
        <button style={styles.sendBtn} onClick={onAsk} disabled={answerLoading || !question.trim()}>
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
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.answerCard}
        >
          <ReactMarkdown>{answer}</ReactMarkdown>
        </motion.div>
      )}
    </>
  );
}
