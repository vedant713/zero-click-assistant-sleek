import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const [clipboardText, setClipboardText] = useState("");
  const [activeWindow, setActiveWindow] = useState("");
  const [visible, setVisible] = useState(true);

  const boxRef = useRef(null);     // outer card
  const textRef = useRef(null);    // text content

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onClipboard((t) => setClipboardText(t));
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

  let lastHeight = 0;
  let resizeTimeout;

  const calcAndResize = () => {
    const baseHeight = 110;
    const contentHeight = textRef.current.scrollHeight;
    const desiredHeight = baseHeight + contentHeight;
    const desiredWidth = 640;

    // Only send if height actually changed
    if (Math.abs(contentHeight - lastHeight) > 5) {
      lastHeight = contentHeight;
      window.electronAPI.setSize(desiredWidth, desiredHeight);
    }
  };

  const scheduleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(calcAndResize, 80);
  };

  // 1️⃣ Watch DOM mutations (both grow and shrink)
  const mutationObserver = new MutationObserver(scheduleResize);
  mutationObserver.observe(textRef.current, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  // 2️⃣ Watch layout/font changes
  const resizeObserver = new ResizeObserver(scheduleResize);
  resizeObserver.observe(textRef.current);

  // 3️⃣ Recalculate whenever clipboard text changes
  calcAndResize();

  // 4️⃣ Force check after render (to catch shrink)
  const postRenderCheck = setInterval(calcAndResize, 500);

  return () => {
    clearTimeout(resizeTimeout);
    clearInterval(postRenderCheck);
    mutationObserver.disconnect();
    resizeObserver.disconnect();
  };
}, [clipboardText]);



  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={boxRef}
          key="bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 18,
          }}

          style={{
            backdropFilter: "blur(22px) saturate(200%)",
            background: "rgba(22, 22, 24, 0.35)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "18px",
            color: "white",
            width: "640px",              // match window width
            padding: "18px 26px 30px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 0 8px rgba(255,255,255,0.05)",
            fontFamily: "Inter, system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            position: "relative",
            overflow: "hidden",           // no scrollbars
          }}
        >
          {/* draggable top zone */}
          <div
            style={{
              WebkitAppRegion: "drag",
              height: 22,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              cursor: "move",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.3rem", filter: "drop-shadow(0 0 4px rgba(255,20,147,0.4))" }}>🧠</span>
            <h3 style={{ fontWeight: 600, fontSize: "1.05rem", margin: 0 }}>Zero-Click Research Assistant</h3>
          </div>

          <div style={{ marginTop: 10 }}>
            <pre
              ref={textRef}
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.92)",
                margin: 0,
                whiteSpace: "pre-wrap",    // preserve formatting and wrap
                wordBreak: "break-word",
                fontFamily: "JetBrains Mono, Consolas, monospace",
              }}
            >
{clipboardText
  ? clipboardText
  : activeWindow
  ? `Active Window: ${activeWindow}`
  : "Copy text or open a document to see insights..."}
            </pre>
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
            ⌨️ Ctrl + Shift + Space = Toggle | Ctrl + Shift + Q = Quit
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
