import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const [clipboardText, setClipboardText] = useState("");
  const [activeWindow, setActiveWindow] = useState("");
  const [visible, setVisible] = useState(true);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onClipboard((t) => {
        console.log("📋 Clipboard:", t.slice(0, 100));
        setClipboardText(t);
        setSummary("");
        setLoading(true);
      });

      window.electronAPI.onSummaryStream((chunk) => {
        console.log("💬 Stream chunk:", chunk);
        setSummary((prev) => prev + chunk);
      });

      window.electronAPI.onSummary(({ text, summary }) => {
        console.log("✅ Summary complete.");
        setClipboardText(text);
        setSummary(summary);
        setLoading(false);
      });

      window.electronAPI.onActiveWindow((w) => setActiveWindow(w));
    }

    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!textRef.current || !window.electronAPI?.setSize) return;
    const baseHeight = 120;
    const h = baseHeight + textRef.current.scrollHeight + summary.length * 0.3;
    window.electronAPI.setSize(720, Math.min(h, 800));
  }, [clipboardText, summary]);

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
            background: "rgba(22,22,24,0.35)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "18px",
            color: "white",
            width: "720px",
            padding: "18px 26px 30px",
            fontFamily: "Inter, system-ui, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ WebkitAppRegion: "drag", height: 22, cursor: "move" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.3rem" }}>🧠</span>
            <h3 style={{ fontWeight: 600, fontSize: "1.05rem", margin: 0 }}>
              Zero-Click Research Assistant
            </h3>
          </div>

          <div style={{ marginTop: 10 }}>
            <pre
              ref={textRef}
              style={{
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
            </pre>

            {loading && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ marginTop: 10, fontSize: "0.85rem", color: "#aaa" }}
              >
                Summarizing...
              </motion.div>
            )}

            <AnimatePresence>
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
                  <strong>Summary:</strong> {summary}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 16,
              fontSize: "0.7rem",
              opacity: 0.55,
            }}
          >
            ⌨️ Ctrl+Shift+Space = Toggle | Ctrl+Shift+Q = Quit
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
