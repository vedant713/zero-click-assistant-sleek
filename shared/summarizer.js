const { GoogleGenerativeAI } = require("@google/generative-ai");
const http = require("http");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

let ollamaAvailable = null;

async function checkOllamaAvailable() {
  if (ollamaAvailable !== null) {
    return ollamaAvailable;
  }
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: 11434,
          path: "/api/tags",
          method: "GET",
          timeout: 3000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
        }
      );
      req.on("error", reject);
      req.on("timeout", () => reject(new Error("Request timeout")));
      req.end();
    });
    ollamaAvailable = response.statusCode === 200;
    if (ollamaAvailable) {
      console.log("✅ Ollama is available");
    } else {
      console.log("⚠️ Ollama responded with status:", response.statusCode);
    }
    return ollamaAvailable;
  } catch (err) {
    console.log("❌ Ollama not available:", err.message);
    ollamaAvailable = false;
    return false;
  }
}

async function callOllama(prompt, systemPrompt = "You are a helpful assistant.") {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3:latest",
      prompt: prompt,
      system: systemPrompt,
      stream: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.response;
}

async function summarizeWithOllama(text) {
  try {
    console.log("⚡ Ollama summarization started...");
    const summaryPrompt = `
You are a summarization assistant.
Summarize the following text in 5–7 concise bullet points.
Avoid unnecessary commentary, repetition, or intro phrases like "Here is a summary".
Be objective and clear.

Text:
${text}
`;
    const summary = await callOllama(summaryPrompt, "You are a summarization assistant that creates concise bullet-point summaries.");
    const cleanedSummary = summary.replace(/^['\''.\d\-\*\)\s]+/, "").trim();

    let followUps = [];
    try {
      const followPrompt = `
Based on the text and its summary, suggest 3 insightful follow-up questions
that a user might want to ask to understand the topic better.
Output only the 3 questions as a simple numbered list (no introduction).

Text:
${text}

Summary:
${cleanedSummary}
`;
      const rawFollowUps = await callOllama(followPrompt, "You suggest 3 follow-up questions based on provided text. Output as simple numbered list.");
      followUps = rawFollowUps
        .split("\n")
        .map((q) => q.replace(/^['\''.\d\-\*\)\s]+/, "").trim())
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
      console.error("⚠️ Ollama follow-up question generation failed:", e);
      followUps = [];
    }

    console.log("✅ Ollama summarization done.");
    return { summary: cleanedSummary, followUps };
  } catch (err) {
    console.error("❌ Ollama summarization error:", err);
    throw err;
  }
}

async function qaWithOllama(context, question) {
  try {
    console.log("💬 Ollama Q&A started...");
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
    const answer = await callOllama(prompt, "You answer questions based on the provided context. Be clear and concise.");
    console.log("✅ Ollama Q&A done.");
    return answer.replace(/^['\''.\d\-\*\)\s]+/, "").trim();
  } catch (err) {
    console.error("❌ Ollama Q&A error:", err);
    throw err;
  }
}

async function summarizeWithGemini(text) {
  try {
    console.log("⚡ Gemini summarization started...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
        .map((q) => q.replace(/^[\d\-\*\.\)]\s*/, "").trim())
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
    return "I couldn't generate an answer.";
  }
}

function getMockSummary(text) {
  const words = text.split(/\s+/).slice(0, 50);
  const summary = `This text contains ${words.length} words. It discusses key concepts and provides detailed information on the topic. The content appears to cover important aspects of the subject matter with thorough explanations and relevant details.`;
  return {
    summary,
    followUps: [
      "What are the main points discussed in this text?",
      "How does this information relate to the broader context?",
      "What conclusions can be drawn from this content?",
    ],
  };
}

function getMockAnswer(question) {
  return "Based on the provided context, here's what I can tell you: The content covers the main topics thoroughly. For more specific details, please provide more context or rephrase your question.";
}

async function summarize(text) {
  const isOllamaAvailable = await checkOllamaAvailable();
  
  if (isOllamaAvailable) {
    try {
      return await summarizeWithOllama(text);
    } catch (err) {
      console.log("⚠️ Ollama failed, falling back to Gemini...");
    }
  }
  
  if (process.env.GOOGLE_API_KEY) {
    try {
      return await summarizeWithGemini(text);
    } catch (err) {
      console.log("⚠️ Gemini failed, falling back to mock mode...");
    }
  }
  
  console.log("📦 Using mock summarization mode.");
  return getMockSummary(text);
}

async function qa(context, question) {
  const isOllamaAvailable = await checkOllamaAvailable();
  
  if (isOllamaAvailable) {
    try {
      return await qaWithOllama(context, question);
    } catch (err) {
      console.log("⚠️ Ollama failed, falling back to Gemini...");
    }
  }
  
  if (process.env.GOOGLE_API_KEY) {
    try {
      return await qaWithGemini(context, question);
    } catch (err) {
      console.log("⚠️ Gemini failed, falling back to mock mode...");
    }
  }
  
  console.log("📦 Using mock Q&A mode.");
  return getMockAnswer(question);
}

module.exports = { summarize, qa, summarizeWithGemini, qaWithGemini, summarizeWithOllama, qaWithOllama };
