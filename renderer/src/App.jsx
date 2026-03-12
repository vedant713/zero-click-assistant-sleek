import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

console.log("📱 App.jsx loaded!");

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
    padding: "24px 28px 28px",
    fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
    color: "#e4e4e7",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  title: {
    fontSize: "1.15rem",
    fontWeight: 700,
    margin: 0,
    background: "linear-gradient(90deg, #f8fafc, #c4b5fd)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px",
  },
  modeTabs: {
    display: "flex",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  tab: (active) => ({
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: active ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "transparent",
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
    fontSize: "0.8rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.25s ease",
    display: "flex",
    alignItems: "center",
    gap: 6,
  }),
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "rgba(255,255,255,0.4)",
    fontWeight: 600,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px #22c55e",
  },
  textPreview: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.6,
    maxHeight: 100,
    overflow: "hidden",
    fontFamily: "'Cascadia Code', 'Consolas', monospace",
  },
  summaryBox: {
    background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 14,
    padding: 18,
    marginTop: 14,
  },
  summaryText: {
    fontSize: "0.9rem",
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.9)",
  },
  followUpsContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  followUpLabel: {
    fontSize: "0.7rem",
    color: "#34d399",
    fontWeight: 600,
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  followUpBtn: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    marginBottom: 6,
    background: "rgba(52,211,153,0.08)",
    border: "1px solid rgba(52,211,153,0.15)",
    borderRadius: 10,
    color: "#6ee7b7",
    fontSize: "0.8rem",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  inputWrapper: {
    position: "relative",
    marginTop: 16,
  },
  input: {
    width: "100%",
    padding: "14px 18px",
    paddingRight: 50,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "0.9rem",
    outline: "none",
    transition: "all 0.2s ease",
  },
  sendBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    transition: "all 0.2s ease",
  },
  answerCard: {
    marginTop: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
  },
  emptyState: {
    textAlign: "center",
    padding: "32px 16px",
    color: "rgba(255,255,255,0.35)",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.5,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    fontSize: "0.65rem",
    color: "rgba(255,255,255,0.25)",
  },
  shortcut: {
    display: "flex",
    gap: 12,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    fontSize: "0.7rem",
  },
};

export default function App() {
  const [clipboardText, setClipboardText] = useState("");
  const [activeWindow, setActiveWindow] = useState("");
  const [visible, setVisible] = useState(true);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("summarize");
  const [followUps, setFollowUps] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
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

    const handleClipboard = (t) => {
      setClipboardText(t);
      setSummary("");
      setAnswer("");
      setFollowUps([]);
      setConversation([]);
      if (mode === "summarize") {
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

    const handleActiveWindow = (w) => setActiveWindow(w);

    window.electronAPI.removeAllListeners?.("clipboard");
    window.electronAPI.removeAllListeners?.("summary-event");
    window.electronAPI.removeAllListeners?.("active-window");

    window.electronAPI.onClipboard(handleClipboard);
    window.electronAPI.onSummary(handleSummary);
    window.electronAPI.onActiveWindow(handleActiveWindow);

    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.electronAPI.removeAllListeners?.("clipboard");
      window.electronAPI.removeAllListeners?.("summary-event");
      window.electronAPI.removeAllListeners?.("active-window");
    };
  }, [mode]);

  useEffect(() => {
    setClipboardText("");
    setSummary("");
    setQuestion("");
    setAnswer("");
    setLoading(false);
    setAnswerLoading(false);
    setFollowUps([]);
    setConversation([]);
  }, [mode]);

  useEffect(() => {
    if (!window.electronAPI?.setSize) return;
    const contentHeight = document.body.scrollHeight;
    const height = Math.max(200, Math.min(contentHeight + 60, 800));
    window.electronAPI.setSize({ width: 820, height });
  }, [clipboardText, summary, answer, mode, followUps, conversation, answerLoading, loading]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAnswer("");
    setAnswerLoading(true);
    try {
      const res = await window.electronAPI.qa(clipboardText, question);
      setAnswer(res || "No answer received.");
    } catch (err) {
      setAnswer("Failed to generate an answer.");
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleFollowUp = async (q) => {
    const cleanQ = q.replace(/^[.\d\-\*\)\s]+/, "").trim();
    setQuestion(cleanQ);
    setAnswer("");
    setAnswerLoading(true);
    try {
      const res = await window.electronAPI.qa(clipboardText, q);
      const followData = await window.electronAPI.summarize(`User Question: ${q}\n\nGemini Answer: ${res}`);
      setConversation((prev) => [...prev, { question: q, answer: res, followUps: followData?.followUps || [] }]);
    } catch (err) {
      setAnswer("Failed to generate answer.");
    } finally {
      setAnswerLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={styles.container}
        >
          <div style={{ WebkitAppRegion: "drag", height: 10 }} />

          <div style={styles.header}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>✨</div>
              <h3 style={styles.title}>Zero-Click</h3>
            </div>
            <div style={styles.modeTabs}>
              {[
                { key: "summarize", icon: "📝", label: "Summarize" },
                { key: "qa", icon: "💬", label: "Ask" },
                { key: "voice", icon: "🎤", label: "Voice" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  style={styles.tab(mode === m.key)}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "summarize" && (
            <>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardLabel}>Clipboard Content</span>
                  <div style={styles.statusDot} />
                </div>
                <pre style={styles.textPreview}>
                  {clipboardText || activeWindow || "Copy any text to get started..."}
                </pre>
              </div>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ fontSize: 14 }}
                  >
                    ⟳
                  </motion.span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                    Analyzing content...
                  </span>
                </motion.div>
              )}

              {summary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.summaryBox}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 16 }}>📋</span>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#c4b5fd" }}>Summary</span>
                  </div>
                  <div style={styles.summaryText}>
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>

                  {followUps.length > 0 && (
                    <div style={styles.followUpsContainer}>
                      <div style={styles.followUpLabel}>
                        <span>💡</span> Suggested Questions
                      </div>
                      {followUps.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleFollowUp(q)}
                          style={styles.followUpBtn}
                          onMouseEnter={(e) => {
                            e.target.style.background = "rgba(52,211,153,0.15)";
                            e.target.style.transform = "translateX(4px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "rgba(52,211,153,0.08)";
                            e.target.style.transform = "translateX(0)";
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
                      style={{ marginTop: 14, color: "#a5b4fc", fontSize: "0.8rem" }}
                    >
                      💭 Generating answer...
                    </motion.div>
                  )}

                  {answer && !answerLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={styles.answerCard}
                    >
                      <div style={{ fontSize: "0.75rem", color: "#818cf8", marginBottom: 8, fontWeight: 500 }}>
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
                  <div style={{ fontSize: "0.9rem" }}>Copy any text to summarize</div>
                  <div style={{ fontSize: "0.75rem", marginTop: 6 }}>Works with articles, code, and more</div>
                </div>
              )}
            </>
          )}

          {conversation.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ marginTop: 14 }}
            >
              <div style={{ color: "#818cf8", fontSize: "0.8rem", marginBottom: 8 }}>
                💬 {item.question}
              </div>
              <div style={styles.answerCard}>
                <ReactMarkdown>{item.answer}</ReactMarkdown>
              </div>
            </motion.div>
          ))}

          {mode === "qa" && (
            <>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Ask a question about the text..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(99,102,241,0.5)";
                    e.target.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    e.target.style.background = "rgba(255,255,255,0.05)";
                  }}
                />
                <button
                  style={styles.sendBtn}
                  onClick={handleAsk}
                  onMouseEnter={(e) => e.target.style.transform = "translateY(-50%) scale(1.1)"}
                  onMouseLeave={(e) => e.target.style.transform = "translateY(-50%) scale(1)"}
                >
                  ➤
                </button>
              </div>

              {answerLoading && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  style={{ marginTop: 16, color: "#a5b4fc", fontSize: "0.85rem", textAlign: "center" }}
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

          {mode === "voice" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ ...styles.card, textAlign: "center", padding: "40px 20px" }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎤</div>
              <div style={{ fontSize: "1rem", fontWeight: 500, marginBottom: 8 }}>Voice Mode</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                Coming soon
              </div>
            </motion.div>
          )}

          <div style={styles.footer}>
            <div style={styles.shortcut}>
              <span style={styles.badge}>Ctrl+Alt+O Toggle</span>
              <span style={styles.badge}>Ctrl+Alt+R Reset</span>
              <span style={styles.badge}>Ctrl+Alt+X Quit</span>
              <span style={styles.badge}>Ctrl+Alt+Arrows Move</span>
            </div>
            <span>v1.0</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
