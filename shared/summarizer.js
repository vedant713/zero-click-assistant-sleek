const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
const { config } = require('./config');
const features = require('./features');
const { logger } = require('./logger');

const genAI = config.gemini.apiKey ? new GoogleGenerativeAI(config.gemini.apiKey) : null;

function validateText(text, maxLength = 50000) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required and must be a string');
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Text cannot be empty');
  }
  if (trimmed.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }
  return trimmed;
}

let ollamaAvailable = null;

function resetOllamaCache() {
  ollamaAvailable = null;
}

async function checkOllamaAvailable() {
  if (ollamaAvailable !== null) {
    return ollamaAvailable;
  }
  try {
    const ollamaUrl = new URL(config.ollama.baseUrl);
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: ollamaUrl.hostname,
          port: ollamaUrl.port || 11434,
          path: '/api/tags',
          method: 'GET',
          timeout: 3000,
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        }
      );
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
    ollamaAvailable = response.statusCode === 200;
    if (ollamaAvailable) {
      logger.ollama.complete('Ollama is available');
    } else {
      logger.ollama.warn(`Ollama responded with status: ${response.statusCode}`);
    }
    return ollamaAvailable;
  } catch (err) {
    logger.ollama.warn(`Ollama not available: ${err.message}`);
    ollamaAvailable = false;
    return false;
  }
}

async function callOllama(prompt, systemPrompt = 'You are a helpful assistant.') {
  let settings;
  try {
    settings = features.getSettings();
  } catch (e) {
    settings = {};
  }
  const model = settings?.ollamaModel || config.ollama.model;

  const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
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
    const validText = validateText(text);
    logger.ollama.start('Ollama summarization');
    const summaryPrompt = `
You are a summarization assistant.
Summarize the following text in 5–7 concise bullet points.
Avoid unnecessary commentary, repetition, or intro phrases like "Here is a summary".
Be objective and clear.

Text:
${validText}
`;
    const summary = await callOllama(
      summaryPrompt,
      'You are a summarization assistant that creates concise bullet-point summaries.'
    );
    const cleanedSummary = summary.replace(/^['\''.\d\-\*\)\s]+/, '').trim();

    let followUps = [];
    try {
      const followPrompt = `
Based on the text and its summary, suggest 3 insightful follow-up questions
that a user might want to ask to understand the topic better.
Output only the 3 questions as a simple numbered list (no introduction).

Text:
${validText}

Summary:
${cleanedSummary}
`;
      const rawFollowUps = await callOllama(
        followPrompt,
        'You suggest 3 follow-up questions based on provided text. Output as simple numbered list.'
      );
      followUps = rawFollowUps
        .split('\n')
        .map(q => q.replace(/^['\''.\d\-\*\)\s]+/, '').trim())
        .filter(
          q =>
            q.length > 0 &&
            !q.toLowerCase().startsWith('here are') &&
            !q.toLowerCase().startsWith('based on') &&
            !q.toLowerCase().startsWith('text:') &&
            !q.toLowerCase().startsWith('summary:')
        )
        .slice(0, 3);
    } catch (e) {
      logger.ollama.warn(`Ollama follow-up question generation failed: ${e.message}`);
      followUps = [];
    }

    logger.ollama.complete('Ollama summarization');
    return { summary: cleanedSummary, followUps };
  } catch (err) {
    logger.ollama.fail('Ollama summarization', err);
    throw err;
  }
}

async function qaWithOllama(context, question) {
  try {
    if (!context || typeof context !== 'string') {
      throw new Error('Context is required');
    }
    if (!question || typeof question !== 'string') {
      throw new Error('Question is required');
    }
    logger.ollama.start('Ollama Q&A');
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
    const answer = await callOllama(
      prompt,
      'You answer questions based on the provided context. Be clear and concise.'
    );
    logger.ollama.complete('Ollama Q&A');
    return answer.replace(/^['\''.\d\-\*\)\s]+/, '').trim();
  } catch (err) {
    logger.ollama.fail('Ollama Q&A', err);
    throw err;
  }
}

async function summarizeWithGemini(text) {
  if (!genAI) {
    throw new Error('Google API key not configured');
  }
  try {
    const validText = validateText(text);
    logger.gemini.start('Gemini summarization');
    const model = genAI.getGenerativeModel({ model: config.gemini.model });

    const summaryPrompt = `
You are a summarization assistant.
Summarize the following text in 5–7 concise bullet points.
Avoid unnecessary commentary, repetition, or intro phrases like "Here is a summary".
Be objective and clear.

Text:
${validText}
`;

    const result = await model.generateContent(summaryPrompt);
    const summary = result?.response?.text?.().trim?.() || 'No summary generated.';

    logger.gemini.info('Summary generated.');

    let followUps = [];
    try {
      const followPrompt = `
Based on the text and its summary, suggest 3 insightful follow-up questions
that a user might want to ask to understand the topic better.
Output only the 3 questions as a simple numbered list (no introduction).

Text:
${validText}

Summary:
${summary}
`;

      const qResult = await model.generateContent(followPrompt);
      const rawText = qResult?.response?.text?.().trim?.() || '';

      followUps = rawText
        .split('\n')
        .map(q => q.replace(/^[\d\-\*\.\)]\s*/, '').trim())
        .filter(
          q =>
            q.length > 0 &&
            !q.toLowerCase().startsWith('here are') &&
            !q.toLowerCase().startsWith('based on') &&
            !q.toLowerCase().startsWith('text:') &&
            !q.toLowerCase().startsWith('summary:')
        )
        .slice(0, 3);
    } catch (e) {
      logger.gemini.warn(`Follow-up question generation failed: ${e.message}`);
      followUps = [];
    }

    logger.gemini.debug(`Follow-up questions generated: ${followUps.length}`);
    return { summary, followUps };
  } catch (err) {
    logger.gemini.fail('Gemini summarization', err);
    return { summary: 'Summarization failed.', followUps: [] };
  }
}

async function qaWithGemini(context, question) {
  if (!genAI) {
    throw new Error('Google API key not configured');
  }
  try {
    if (!context || typeof context !== 'string') {
      throw new Error('Context is required');
    }
    if (!question || typeof question !== 'string') {
      throw new Error('Question is required');
    }
    logger.gemini.start('Gemini Q&A');
    const model = genAI.getGenerativeModel({ model: config.gemini.model });

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
    const answer = result?.response?.text?.().trim?.() || 'No answer generated.';

    logger.gemini.complete('Gemini Q&A');
    return answer;
  } catch (err) {
    logger.gemini.fail('Gemini Q&A', err);
    return "I couldn't generate an answer.";
  }
}

function getMockSummary(text) {
  const words = text.split(/\s+/).slice(0, 50);
  const summary = `This text contains ${words.length} words. It discusses key concepts and provides detailed information on the topic. The content appears to cover important aspects of the subject matter with thorough explanations and relevant details.`;
  return {
    summary,
    followUps: [
      'What are the main points discussed in this text?',
      'How does this information relate to the broader context?',
      'What conclusions can be drawn from this content?',
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
      logger.ollama.warn('Ollama failed, falling back to Gemini');
    }
  }

  if (config.gemini.apiKey) {
    try {
      return await summarizeWithGemini(text);
    } catch (err) {
      logger.gemini.warn('Gemini failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock summarization mode');
  return getMockSummary(text);
}

async function qa(context, question) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await qaWithOllama(context, question);
    } catch (err) {
      logger.ollama.warn('Ollama failed, falling back to Gemini');
    }
  }

  if (config.gemini.apiKey) {
    try {
      return await qaWithGemini(context, question);
    } catch (err) {
      logger.gemini.warn('Gemini failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock Q&A mode');
  return getMockAnswer(question);
}

module.exports = {
  summarize,
  qa,
  summarizeWithGemini,
  qaWithGemini,
  summarizeWithOllama,
  qaWithOllama,
  checkOllamaAvailable,
  resetOllamaCache,
  getMockSummary,
  getMockAnswer,
};
