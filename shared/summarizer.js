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

  let settings;
  try {
    settings = features.getSettings();
  } catch (e) {
    settings = {};
  }
  const targetModel = settings?.ollamaModel || config.ollama.model;

  const maxRetries = 2;
  const baseTimeout = 10000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const ollamaUrl = new URL(config.ollama.baseUrl);
      const timeout = baseTimeout * Math.pow(2, attempt);
      const fullUrl = `http://${ollamaUrl.hostname}:${ollamaUrl.port || 11434}/api/tags`;
      logger.ollama.info(
        `Checking Ollama availability (attempt ${attempt + 1}): ${fullUrl}, model: ${targetModel}`
      );
      const response = await new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: ollamaUrl.hostname,
            port: ollamaUrl.port || 11434,
            path: '/api/tags',
            method: 'GET',
            timeout: timeout,
            agent: false,
          },
          res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
          }
        );
        req.on('error', err => {
          const errMsg = err.message || String(err);
          const errCode = err.code || 'unknown';
          logger.ollama.warn(
            `Ollama request error (attempt ${attempt + 1}): ${fullUrl} - ${errCode}: ${errMsg}`
          );
          reject(err);
        });
        req.on('timeout', () => reject(new Error('Request timeout')));
        req.end();
      });

      if (response.statusCode !== 200) {
        ollamaAvailable = false;
        logger.ollama.warn(`Ollama responded with status: ${response.statusCode}`);
        return ollamaAvailable;
      }

      try {
        const parsed = JSON.parse(response.body);
        const availableModels = parsed.models || [];
        const modelNames = availableModels.map(m => m.name);
        const modelExists = modelNames.some(
          name => name === targetModel || name.startsWith(targetModel.replace(/:.*$/, ''))
        );

        if (!modelExists) {
          ollamaAvailable = false;
          logger.ollama.warn(
            `Model '${targetModel}' not found. Available: ${modelNames.join(', ')}`
          );
          return ollamaAvailable;
        }

        ollamaAvailable = true;
        logger.ollama.complete(`Ollama is available with model '${targetModel}'`);
        return ollamaAvailable;
      } catch (parseErr) {
        logger.ollama.warn(`Failed to parse Ollama /api/tags response: ${parseErr.message}`);
        ollamaAvailable = false;
        return false;
      }
    } catch (err) {
      const errMsg = err.message || String(err);
      const errCode = err.code || 'unknown';
      logger.ollama.warn(
        `Ollama availability check attempt ${attempt + 1} failed: ${fullUrl} - ${errCode}: ${errMsg}`
      );
      if (attempt === maxRetries) {
        ollamaAvailable = false;
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, baseTimeout * Math.pow(2, attempt)));
    }
  }
  return false;
}

async function callOllama(prompt, systemPrompt = 'You are a helpful assistant.') {
  let settings;
  try {
    settings = features.getSettings();
  } catch (e) {
    settings = {};
  }
  const model = settings?.ollamaModel || config.ollama.model;
  const timeoutMs = config.ollama.timeout || 60000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.ollama.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.message.content;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
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
    const summary = result?.response?.text()?.trim() || 'No summary generated.';

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
      const rawText = qResult?.response?.text()?.trim() || '';

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
    const answer = result?.response?.text()?.trim() || 'No answer generated.';

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

async function translateWithOllama(text, targetLanguage) {
  try {
    const validText = validateText(text);
    logger.ollama.start('Ollama translation');
    const prompt = `Translate the following text to ${targetLanguage}. Provide only the translation, no explanations:\n\n${validText}`;
    const translation = await callOllama(
      prompt,
      'You are a professional translator. Provide accurate translations without additional commentary.'
    );
    logger.ollama.complete('Ollama translation');
    return translation.replace(/^['\''.\d\-\*\)\s]+/, '').trim();
  } catch (err) {
    logger.ollama.fail('Ollama translation', err);
    throw err;
  }
}

async function translateWithGemini(text, targetLanguage) {
  if (!genAI) {
    throw new Error('Google API key not configured');
  }
  try {
    const validText = validateText(text);
    logger.gemini.start('Gemini translation');
    const model = genAI.getGenerativeModel({ model: config.gemini.model });

    const prompt = `Translate the following text to ${targetLanguage}. Provide only the translation, no explanations:\n\n${validText}`;

    const result = await model.generateContent(prompt);
    const translation = result?.response?.text()?.trim() || 'Translation failed.';

    logger.gemini.complete('Gemini translation');
    return translation;
  } catch (err) {
    logger.gemini.fail('Gemini translation', err);
    throw err;
  }
}

function getMockTranslation(text, targetLanguage) {
  return `[${targetLanguage}] ${text} (translated)`;
}

async function explainCodeWithOllama(code) {
  try {
    const validText = validateText(code, 30000);
    logger.ollama.start('Ollama code explanation');
    const prompt = `Explain what this code does in simple, clear terms. Break down what each section does and how the parts work together:\n\n${validText}`;
    const explanation = await callOllama(
      prompt,
      'You explain code in simple terms. Be clear and educational.'
    );
    logger.ollama.complete('Ollama code explanation');
    return explanation.replace(/^['\''.\d\-\*\)\s]+/, '').trim();
  } catch (err) {
    logger.ollama.fail('Ollama code explanation', err);
    throw err;
  }
}

function getMockCodeExplanation(code) {
  const lines = code.split('\n').length;
  const lang =
    code.includes('function') || code.includes('const') || code.includes('let')
      ? 'JavaScript'
      : code.includes('def ') || code.includes('import ')
        ? 'Python'
        : code.includes('class ') || code.includes('public ')
          ? 'Java/C#'
          : 'code';
  return `This is a ${lang} code snippet with ${lines} lines. It contains typical programming constructs. The code performs various operations including variable declarations, function definitions, and control flow statements. For a detailed explanation, please provide more context about the specific code.`;
}

async function fixGrammarWithOllama(text) {
  try {
    const validText = validateText(text);
    logger.ollama.start('Ollama grammar fix');
    const prompt = `Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text with no explanations:\n\n${validText}`;
    const fixed = await callOllama(
      prompt,
      'You fix grammar, spelling, and punctuation errors. Provide only corrected text.'
    );
    logger.ollama.complete('Ollama grammar fix');
    return fixed.replace(/^['\''.\d\-\*\)\s]+/, '').trim();
  } catch (err) {
    logger.ollama.fail('Ollama grammar fix', err);
    throw err;
  }
}

function getMockGrammarFix(text) {
  const words = text.split(/\s+/);
  if (words.length < 3) return text;
  const fixed = text
    .replace(/\bi\b/g, 'I')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*\./g, '.')
    .trim();
  return fixed || text;
}

async function sentimentWithOllama(text) {
  try {
    const validText = validateText(text);
    logger.ollama.start('Ollama sentiment analysis');
    const prompt = `Analyze the sentiment of the following text. Classify it as POSITIVE, NEGATIVE, or NEUTRAL and explain why in one sentence:\n\n${validText}`;
    const analysis = await callOllama(
      prompt,
      'You analyze sentiment. Classify as POSITIVE, NEGATIVE, or NEUTRAL with brief explanation.'
    );
    logger.ollama.complete('Ollama sentiment analysis');
    const cleaned = analysis.replace(/^['\''.\d\-\*\)\s]+/, '').trim();

    let sentiment = 'NEUTRAL';
    const lower = cleaned.toLowerCase();
    if (lower.includes('positive') && !lower.includes('not positive')) {
      sentiment = 'POSITIVE';
    } else if (lower.includes('negative') && !lower.includes('not negative')) {
      sentiment = 'NEGATIVE';
    }

    const explanation = cleaned;
    return { sentiment, explanation };
  } catch (err) {
    logger.ollama.fail('Ollama sentiment analysis', err);
    throw err;
  }
}

function getMockSentiment(text) {
  const words = text.toLowerCase().split(/\s+/);
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'love',
    'happy',
    'best',
    'awesome',
    'fantastic',
  ];
  const negativeWords = [
    'bad',
    'terrible',
    'awful',
    'hate',
    'sad',
    'worst',
    'horrible',
    'poor',
    'disappointing',
    'angry',
  ];

  const posCount = words.filter(w => positiveWords.includes(w)).length;
  const negCount = words.filter(w => negativeWords.includes(w)).length;

  let sentiment = 'NEUTRAL';
  if (posCount > negCount) sentiment = 'POSITIVE';
  else if (negCount > posCount) sentiment = 'NEGATIVE';

  const explanation =
    sentiment === 'POSITIVE'
      ? 'The text contains positive language and expressions.'
      : sentiment === 'NEGATIVE'
        ? 'The text contains negative language and expressions.'
        : 'The text is balanced or neutral in tone.';

  return { sentiment, explanation };
}

async function keywordsWithOllama(text) {
  try {
    const validText = validateText(text);
    logger.ollama.start('Ollama keyword extraction');
    const prompt = `Extract the key topics and keywords from the following text. List them as comma-separated keywords (no explanations, no numbering):\n\n${validText}`;
    const keywords = await callOllama(
      prompt,
      'You extract key topics and keywords. List them as comma-separated values only.'
    );
    logger.ollama.complete('Ollama keyword extraction');
    const cleaned = keywords.replace(/^['\''.\d\-\*\)\s]+/, '').trim();
    const keywordList = cleaned
      .split(/[,;]/)
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .slice(0, 10);
    return keywordList;
  } catch (err) {
    logger.ollama.fail('Ollama keyword extraction', err);
    throw err;
  }
}

function getMockKeywords(text) {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = [
    'the',
    'a',
    'an',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'can',
    'to',
    'of',
    'in',
    'for',
    'on',
    'with',
    'at',
    'by',
    'from',
    'as',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'between',
    'under',
    'and',
    'or',
    'but',
    'if',
    'because',
    'while',
    'although',
    'that',
    'which',
    'who',
    'whom',
    'this',
    'these',
    'those',
    'it',
    'its',
  ];
  const filtered = words.filter(w => w.length > 4 && !stopWords.includes(w));
  const freq = {};
  filtered.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(e => e[0]);
}

async function replyWithOllama(context) {
  try {
    const validText = validateText(context);
    logger.ollama.start('Ollama reply generation');
    const prompt = `Generate a quick, relevant reply based on this context. Keep it concise and natural:\n\n${validText}`;
    const reply = await callOllama(prompt, 'You generate quick, natural replies based on context.');
    logger.ollama.complete('Ollama reply generation');
    return reply.replace(/^['\''.\d\-\*\)\s]+/, '').trim();
  } catch (err) {
    logger.ollama.fail('Ollama reply generation', err);
    throw err;
  }
}

function getMockReply(context) {
  const lower = context.toLowerCase();
  if (lower.includes('question') || lower.includes('?')) {
    return "That's a great question. I'd be happy to help you with that.";
  } else if (lower.includes('thank')) {
    return "You're welcome! Let me know if you need anything else.";
  } else if (lower.includes('hello') || lower.includes('hi')) {
    return 'Hello! How can I assist you today?';
  }
  return 'Thank you for sharing that. Let me think about it and get back to you.';
}

async function titleWithOllama(content) {
  try {
    const validText = validateText(content, 10000);
    logger.ollama.start('Ollama title generation');
    const prompt = `Create an engaging, descriptive title for this content. Keep it concise (5-10 words). No quotes or extra formatting:\n\n${validText}`;
    const title = await callOllama(
      prompt,
      'You create engaging titles. Keep them concise and descriptive.'
    );
    logger.ollama.complete('Ollama title generation');
    return title
      .replace(/^['\''".\d\-\*\)\s]+/, '')
      .replace(/['\''"]/g, '')
      .trim();
  } catch (err) {
    logger.ollama.fail('Ollama title generation', err);
    throw err;
  }
}

function getMockTitle(content) {
  const words = content.split(/\s+/).slice(0, 10);
  return 'Key Insights: ' + words.join(' ').substring(0, 50) + '...';
}

async function meetingNotesWithOllama(transcript) {
  try {
    const validText = validateText(transcript);
    logger.ollama.start('Ollama meeting notes');
    const prompt = `Convert this meeting transcript into structured bullet points. Include: Key Discussion Points, Decisions Made, and Action Items. Use clear formatting:\n\n${validText}`;
    const notes = await callOllama(
      prompt,
      'You create structured meeting notes from transcripts. Include key points, decisions, and action items.'
    );
    logger.ollama.complete('Ollama meeting notes');
    return notes.replace(/^['\''.\d\-\*\)\s]+/, '').trim();
  } catch (err) {
    logger.ollama.fail('Ollama meeting notes', err);
    throw err;
  }
}

function getMockMeetingNotes(transcript) {
  const speakers = (transcript.match(/^[^:]+:/gm) || []).length;
  const words = transcript.split(/\s+/).length;
  return `Meeting Summary:
• Discussion covering ${Math.min(words, 500)} words of content
• ${Math.max(speakers, 1)} participant(s) identified

Key Discussion Points:
• Main topics addressed in the conversation
• Key themes and ideas discussed

Action Items:
• Review meeting transcript for details
• Follow up on any outstanding questions

Note: This is a simplified summary. For detailed notes, please provide a more complete transcript.`;
}

async function translate(text, targetLanguage) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await translateWithOllama(text, targetLanguage);
    } catch (err) {
      logger.ollama.warn('Ollama translate failed, falling back to Gemini');
    }
  }

  if (config.gemini.apiKey) {
    try {
      return await translateWithGemini(text, targetLanguage);
    } catch (err) {
      logger.gemini.warn('Gemini translate failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock translation mode');
  return getMockTranslation(text, targetLanguage);
}

async function explainCode(code) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await explainCodeWithOllama(code);
    } catch (err) {
      logger.ollama.warn('Ollama explainCode failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock code explanation mode');
  return getMockCodeExplanation(code);
}

async function fixGrammar(text) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await fixGrammarWithOllama(text);
    } catch (err) {
      logger.ollama.warn('Ollama fixGrammar failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock grammar fix mode');
  return getMockGrammarFix(text);
}

async function analyzeSentiment(text) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await sentimentWithOllama(text);
    } catch (err) {
      logger.ollama.warn('Ollama analyzeSentiment failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock sentiment analysis mode');
  return getMockSentiment(text);
}

async function extractKeywords(text) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await keywordsWithOllama(text);
    } catch (err) {
      logger.ollama.warn('Ollama extractKeywords failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock keyword extraction mode');
  return getMockKeywords(text);
}

async function generateReply(context) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await replyWithOllama(context);
    } catch (err) {
      logger.ollama.warn('Ollama generateReply failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock reply generation mode');
  return getMockReply(context);
}

async function generateTitle(content) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await titleWithOllama(content);
    } catch (err) {
      logger.ollama.warn('Ollama generateTitle failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock title generation mode');
  return getMockTitle(content);
}

async function meetingNotes(transcript) {
  const isOllamaAvailable = await checkOllamaAvailable();

  if (isOllamaAvailable) {
    try {
      return await meetingNotesWithOllama(transcript);
    } catch (err) {
      logger.ollama.warn('Ollama meetingNotes failed, falling back to mock mode');
    }
  }

  logger.app.info('Using mock meeting notes mode');
  return getMockMeetingNotes(transcript);
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
  translate,
  translateWithOllama,
  translateWithGemini,
  getMockTranslation,
  explainCode,
  explainCodeWithOllama,
  getMockCodeExplanation,
  fixGrammar,
  fixGrammarWithOllama,
  getMockGrammarFix,
  analyzeSentiment,
  sentimentWithOllama,
  getMockSentiment,
  extractKeywords,
  keywordsWithOllama,
  getMockKeywords,
  generateReply,
  replyWithOllama,
  getMockReply,
  generateTitle,
  titleWithOllama,
  getMockTitle,
  meetingNotes,
  meetingNotesWithOllama,
  getMockMeetingNotes,
};
