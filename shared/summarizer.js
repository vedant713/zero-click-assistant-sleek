// shared/summarizer.js (CommonJS version)
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// 🔑 Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * ✳️ Summarizes the provided text in concise bullet points
 * and also generates 3 follow-up questions.
 */
async function summarizeWithGemini(text) {
  try {
    console.log("⚡ Gemini summarization started...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 🧠 Step 1: Generate Summary
    const summaryPrompt = `
You are a summarization assistant.
Summarize the following text in 5–7 concise bullet points.
Avoid unnecessary commentary, repetition, or intro phrases like "Here is a summary".
Be objective and clear.

Text:
${text}
`;

    const result = await model.generateContent(summaryPrompt);
    const summary = result?.response?.text?.().trim?.() || "No summary generated.";

    console.log("✅ Summary generated.");

    // 🧩 Step 2: Generate Follow-Up Questions (safe)
    let followUps = [];
    try {
      const followPrompt = `
Based on the text and its summary, suggest 3 insightful follow-up questions
that a user might want to ask to understand the topic better.
Output only the 3 questions as a simple numbered list (no introduction).

Text:
${text}

Summary:
${summary}
`;

      const qResult = await model.generateContent(followPrompt);
      const rawText = qResult?.response?.text?.().trim?.() || "";

      followUps = rawText
        .split("\n")
        .map((q) => q.replace(/^[\d\-\*\.\)]\s*/, "").trim()) // remove numbering/bullets
        .filter(
          (q) =>
            q.length > 0 &&
            !q.toLowerCase().startsWith("here are") &&
            !q.toLowerCase().startsWith("based on") &&
            !q.toLowerCase().startsWith("text:") &&
            !q.toLowerCase().startsWith("summary:")
        )
        .slice(0, 3);
    } catch (e) {
      console.error("⚠️ Follow-up question generation failed:", e);
      followUps = [];
    }

    console.log("✅ Follow-up questions generated:", followUps);
    return { summary, followUps };
  } catch (err) {
    console.error("❌ Gemini summarization error:", err);
    return { summary: "Summarization failed.", followUps: [] };
  }
}

/**
 * 💬 Answers a user question using the provided context (the copied text)
 */
async function qaWithGemini(context, question) {
  try {
    console.log("💬 Gemini Q&A started...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are a helpful assistant.
Use the following context to answer the user's question clearly and concisely.
If context is limited, answer based on general knowledge.
Use bullet points or short paragraphs when helpful.

Context:
${context}

Question:
${question}
`;

    const result = await model.generateContent(prompt);
    const answer = result?.response?.text?.().trim?.() || "No answer generated.";

    console.log("✅ Gemini Q&A done.");
    return answer;
  } catch (err) {
    console.error("❌ Gemini Q&A error:", err);
    return "I couldn’t generate an answer.";
  }
}

module.exports = { summarizeWithGemini, qaWithGemini };
