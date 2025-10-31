import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function App() {
  const [clipboardText, setClipboardText] = useState("");
  const [activeWindow, setActiveWindow] = useState("");
  const [visible, setVisible] = useState(true);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("summarize"); // summarize | qa | voice
  const [followUps, setFollowUps] = useState([]);
  const [conversation, setConversation] = useState([]); // store each Q&A + its follow-ups

  // 🧠 Q&A state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);

  // 📄 Collapsible text
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef(null);
  useEffect(() => {
    const style = document.createElement("style");
     style.innerHTML = `
    /* Hide scrollbars visually but allow vertical scrolling */
    ::-webkit-scrollbar { 
      width: 0px; 
      background: transparent; 
    }
    html, body {
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }
    html {
      scroll-behavior: smooth;
    }
  `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ⚡ Clipboard + summarization listener (with cleanup + reset)
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleClipboard = async (t) => {
      console.log("📋 Clipboard:", t.slice(0, 100));
      // 🧹 Reset all old states
      setClipboardText(t);
      setSummary("");
      setAnswer("");
      setFollowUps([]);
      setConversation([]); // ✅ Clear conversation threads properly
      setLoading(false);

      if (mode === "summarize") {
        setLoading(true);
        window.electronAPI.summarize(t);
      } else {
        console.log("🛑 Not in summarize mode — ignoring clipboard update.");
      }
    };

    const handleSummaryStream = (chunk) => {
      console.log("💬 Stream chunk:", chunk);
      setSummary((prev) => prev + chunk);
    };

    const handleSummary = ({ text, summary, followUps = [] }) => {
      console.log("✅ Summary complete.");
      setClipboardText(text);
      setSummary(summary);
      setFollowUps(followUps);
      setLoading(false);
    };

    const handleActiveWindow = (w) => setActiveWindow(w);

    // 🧩 Cleanup previous listeners before re-registering
    window.electronAPI.removeAllListeners?.("clipboard");
    window.electronAPI.removeAllListeners?.("summary-event");
    window.electronAPI.removeAllListeners?.("summary-stream");
    window.electronAPI.removeAllListeners?.("active-window");

    // 🪄 Register all listeners again
    window.electronAPI.onClipboard(handleClipboard);
    window.electronAPI.onSummaryStream(handleSummaryStream);
    window.electronAPI.onSummary(handleSummary);
    window.electronAPI.onActiveWindow(handleActiveWindow);

    // 🎛 Keyboard toggle shortcut
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);

    // ✅ Clean up on unmount / mode change
    return () => {
      window.removeEventListener("keydown", onKey);
      window.electronAPI.removeAllListeners?.("clipboard");
      window.electronAPI.removeAllListeners?.("summary-event");
      window.electronAPI.removeAllListeners?.("summary-stream");
      window.electronAPI.removeAllListeners?.("active-window");
    };
  }, [mode]);


  // 🧹 Reset UI on mode switch
  useEffect(() => {
    console.log(`🔄 Mode switched to: ${mode}`);
    setClipboardText("");
    setSummary("");
    setQuestion("");
    setAnswer("");
    setLoading(false);
    setAnswerLoading(false);
    setExpanded(false);
    setFollowUps([]);       // ✅ clears follow-ups
    setConversation([]);    // ✅ clears previous Q&A threads
  }, [mode]);


// 🪟 Auto resize (stable width, dynamic height)
useEffect(() => {
  if (!window.electronAPI?.setSize) return;

  const appElement = document.querySelector("#root") || document.body;

  // Measure visible content height
  const contentHeight = appElement.scrollHeight;
  const minHeight = 140;
  const maxHeight = 800;
  const clampedHeight = Math.max(minHeight, Math.min(contentHeight + 20, maxHeight));

  // ✅ Fixed width to avoid resizing based on text length
  const fixedWidth = 820; // you can tweak this if needed (try 800–850)

  // Apply new size
  window.electronAPI.setSize({ width: fixedWidth, height: clampedHeight });


  // Debounced smooth resize
  setTimeout(() => window.electronAPI.setSize({ width: fixedWidth, height: clampedHeight }), 120);


  // Force compositor refresh (removes ghost borders or flicker)
  requestAnimationFrame(() => {
    const body = document.querySelector("body");
    if (body) {
      body.style.transform = "translateZ(0)";
      setTimeout(() => (body.style.transform = ""), 120);
    }
  });
}, [clipboardText, summary, answer, mode]);




  // 💬 Manual Ask handler
  const handleAsk = async () => {
    if (!question.trim()) return;
    setAnswer("");
    setAnswerLoading(true);
    try {
      const res = await window.electronAPI.qa(clipboardText, question);
      setAnswer(res || "No answer received.");
    } catch (err) {
      console.error("Q&A failed:", err);
      setAnswer("⚠️ Failed to generate an answer.");
    } finally {
      setAnswerLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{
            backdropFilter: "blur(22px) saturate(200%)",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "18px",
            color: "white",
            width: "auto",
            maxWidth: "1000px",
            padding: "18px 26px 30px",
            fontFamily: "Inter, system-ui, sans-serif",
            position: "relative",
            overflow: "visible",
            scrollbarWidth: "none",       // for Firefox
            msOverflowStyle: "none",      // for old Edge/IE

          }}
        >
          {/* 🧱 Drag Header */}
          <div style={{ WebkitAppRegion: "drag", height: 22, cursor: "move" }} />

          {/* 🧠 Header + Mode Switch */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start", // keep items grouped left
              gap: "auto",
              position: "relative",
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                fontSize: "1.05rem",
                margin: 0,
                flexShrink: 0,
              }}
            >
              Zero-Click Research Assistant
            </h3>

            {/* Keep button group pinned to right */}
            <div
              style={{
                position: "absolute",
                right: 0,                     // ✅ fixes it visually
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              {[
                { key: "summarize", label: "🧠 Summarize" },
                { key: "qa", label: "💬 Ask" },
                { key: "voice", label: "🎧 Voice" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  style={{
                    background:
                      mode === m.key
                        ? "linear-gradient(90deg, #ff9f43, #ff6b81)"
                        : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "20px",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    padding: "6px 14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      mode === m.key ? "0 0 10px rgba(255,100,150,0.4)" : "none",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>


          {/* 🧭 Mode label */}
          <p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: 4 }}>
            {mode === "summarize" && "🧠 Summarization Mode"}
            {mode === "qa" && "💬 Ask Mode — Type a question below"}
            {mode === "voice" && "🎧 Voice Mode — Listening soon..."}
          </p>

          {/* 📋 Content */}
          <div style={{ marginTop: 10 }}>
            {/* 🧠 Summarize Mode */}
            {mode === "summarize" && (
              <>
                <motion.pre
                  ref={textRef}
                  animate={{ height: expanded ? "auto" : 140 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    overflow: "hidden",
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.92)",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {clipboardText ||
                    (activeWindow
                      ? `Active Window: ${activeWindow}`
                      : "Copy text to generate summary...")}
                </motion.pre>

                {clipboardText && clipboardText.length > 500 && (
                  <button
                    onClick={() => setExpanded((e) => !e)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9BE7FF",
                      cursor: "pointer",
                      marginTop: 6,
                      fontSize: "0.8rem",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    {expanded ? "Show less ▲" : "Read more ▼"}
                  </button>
                )}

                {loading && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{
                      marginTop: 10,
                      fontSize: "0.85rem",
                      color: "#aaa",
                    }}
                  >
                    Summarizing...
                  </motion.div>
                )}

                {summary && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      marginTop: 12,
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    <strong>Summary:</strong>
                    <ReactMarkdown>{summary}</ReactMarkdown>

                    {/* 🧩 Follow-ups */}
                    {followUps.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <strong style={{ color: "#9BE7FF" }}>Try asking:</strong>
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            marginTop: 6,
                          }}
                        >
                          {followUps.map((q, idx) => (
                            <li key={idx}>
                              <button
                                onClick={async () => {
                                  setQuestion(q);
                                  setAnswer("");
                                  setAnswerLoading(true);

                                  try {
                                    console.log("💬 Asking follow-up:", q);
                                    const res = await window.electronAPI.qa(clipboardText, q);
                                    console.log("🧠 Received answer:", res);
                                    setAnswer("");

                                    // 🔁 generate new follow-ups for this specific Q&A pair
                                    const followData = await window.electronAPI.summarize(
                                      `User Question: ${q}\n\nGemini Answer: ${res}`
                                    );

                                    const newThread = {
                                      question: q,
                                      answer: res,
                                      followUps: followData?.followUps || [],
                                    };

                                    // append this new Q&A block into the conversation list
                                    setConversation((prev) => [...prev, newThread]);
                                  } catch (err) {
                                    console.error("Follow-up Q&A failed:", err);
                                    setAnswer("⚠️ Failed to generate answer.");
                                  } finally {
                                    setAnswerLoading(false);
                                  }
                                }}


                                style={{
                                  background: "rgba(255,255,255,0.08)",
                                  border:
                                    "1px solid rgba(255,255,255,0.15)",
                                  borderRadius: "12px",
                                  padding: "6px 10px",
                                  marginTop: "6px",
                                  color: "white",
                                  fontSize: "0.8rem",
                                  width: "100%",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  transition: "0.2s",
                                }}
                                onMouseEnter={(e) =>
                                (e.target.style.background =
                                  "rgba(255,255,255,0.15)")
                                }
                                onMouseLeave={(e) =>
                                (e.target.style.background =
                                  "rgba(255,255,255,0.08)")
                                }
                              >
                                💬 {q}
                              </button>
                            </li>
                          ))}
                        </ul>

                        {/* 💭 Answer Section */}
                        {answerLoading && (
                          <div
                            style={{ marginTop: 8, opacity: 0.7 }}
                          >
                            💭 Thinking...
                          </div>
                        )}

                        {answer && !answerLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                              marginTop: 12,
                              color: "rgba(255,255,255,0.95)",
                              fontSize: "0.85rem",
                              lineHeight: "1.5",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: 8,
                              padding: "10px 14px",
                            }}
                          >
                            <strong style={{ color: "#9BE7FF" }}>
                              Answer:
                            </strong>
                            <ReactMarkdown>{answer}</ReactMarkdown>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
            {/* 🧠 Conversation Threads */}
            {conversation.map((item, index) => (
              <div key={index} style={{ marginTop: 16 }}>
                <div
                  style={{
                    color: "#9BE7FF",
                    fontSize: "0.85rem",
                    marginBottom: 6,
                  }}
                >
                  💬 {item.question}
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <ReactMarkdown>{item.answer}</ReactMarkdown>
                </div>

                {/* nested follow-ups */}
                {item.followUps.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
                    {item.followUps.map((fq, fidx) => (
                      <li key={fidx}>
                        <button
                          onClick={async () => {
                            setQuestion(fq);
                            setAnswer("");
                            setAnswerLoading(true);

                            try {
                              console.log("💬 Nested follow-up:", fq);
                              const res2 = await window.electronAPI.qa(clipboardText, fq);
                              const followData2 = await window.electronAPI.summarize(
                                `User Question: ${fq}\n\nGemini Answer: ${res2}`
                              );

                              const nestedThread = {
                                question: fq,
                                answer: res2,
                                followUps: followData2?.followUps || [],
                              };

                              setConversation((prev) => [...prev, nestedThread]);
                            } catch (err) {
                              console.error("Nested follow-up failed:", err);
                            } finally {
                              setAnswerLoading(false);
                            }
                          }}
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "12px",
                            padding: "6px 10px",
                            marginTop: "6px",
                            color: "white",
                            fontSize: "0.8rem",
                            width: "100%",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          💭 {fq}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* 💬 Ask Mode */}
            {mode === "qa" && (
              <div style={{ marginTop: 20 }}>
                <input
                  type="text"
                  placeholder="Type your question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: "0.85rem",
                  }}
                />

                {answerLoading && (
                  <div style={{ marginTop: 8, opacity: 0.7 }}>
                    💭 Thinking...
                  </div>
                )}

                {answer && !answerLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      marginTop: 12,
                      color: "rgba(255,255,255,0.95)",
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 8,
                      padding: "10px 14px",
                    }}
                  >
                    <strong style={{ color: "#9BE7FF" }}>Answer:</strong>
                    <ReactMarkdown>{answer}</ReactMarkdown>
                  </motion.div>
                )}
              </div>
            )}

            {/* 🎧 Voice Mode */}
            {mode === "voice" && (
              <div
                style={{
                  marginTop: 20,
                  textAlign: "center",
                  opacity: 0.8,
                  fontSize: "0.9rem",
                }}
              >
                🎙️ Voice mode activated — listening feature coming soon.
              </div>
            )}
          </div>

          {/* Shortcuts footer */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 16,
              fontSize: "0.7rem",
              opacity: 0.55,
            }}
          >
            ⌨️ Ctrl + Shift + Space = Toggle | Ctrl + Shift + Q = Quit
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
