const { spawn } = require("child_process");

async function summarizeWithDeepSeek(text, overlay) {
  return new Promise((resolve, reject) => {
    let output = "";
    const prompt = `
    You are a fast summarization engine.
    - DO NOT explain or think out loud.
    - DO NOT write "Thinking", "Hmm", or internal reasoning.
    - Only output 3–4 concise bullet points directly.

    Text to summarize:
    ${text}
    `;

    console.log("🚀 Starting DeepSeek summarization...");

   const ollamaProc = spawn("ollama", ["run", "llama3:latest"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env },
});



    ollamaProc.stdin.write(prompt);
    ollamaProc.stdin.end();

    ollamaProc.stdout.on("data", (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log("🧾 DeepSeek:", chunk.trim());
    });

    ollamaProc.stderr.on("data", (data) => console.error("❌ Ollama:", data.toString()));

    ollamaProc.on("close", () => {
      // Filter out DeepSeek’s internal reasoning
      const clean = output
        .replace(/(?<=Thinking[\s\S]*)/gi, "") // remove 'Thinking...' sections
        .replace(/\n{2,}/g, "\n")               // collapse blank lines
        .replace(/(\b\w+\b)(?:\s+\1)+/gi, "$1") // remove duplicated words
        .trim();
      console.log("✅ DeepSeek summarization done.");
      resolve(clean || "No summary generated.");
    });

    ollamaProc.on("error", (err) => reject(err));
  });
}

module.exports = { summarizeWithDeepSeek };
