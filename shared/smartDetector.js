const CONTENT_TYPES = {
  CODE: 'code',
  EMAIL: 'email',
  MEETING: 'meeting',
  ARTICLE: 'article',
  URL: 'url',
  JSON: 'json',
  PLAIN: 'plain',
};

const INTENTS = {
  SUMMARIZE: 'summarize',
  EXPLAIN: 'explain',
  TRANSLATE: 'translate',
  FIX_GRAMMAR: 'fixGrammar',
  ANALYZE_SENTIMENT: 'analyzeSentiment',
  EXTRACT_KEYWORDS: 'extractKeywords',
  GENERATE_REPLY: 'generateReply',
  GENERATE_TITLE: 'generateTitle',
  MEETING_NOTES: 'meetingNotes',
  QA: 'qa',
  EXPLAIN_CODE: 'explainCode',
  NONE: 'none',
};

const CODE_PATTERNS = [
  /\bfunction\s*\(/,
  /\b(const|let|var)\s+\w+/,
  /\bdef\s+\w+\s*\(/,
  /\bclass\s+\w+/,
  /\bimport\s+/,
  /\bexport\s+/,
  /\bfrom\s+['"]/,
  /=>/,
  /\{\s*[\w\s,]*\s*\}/,
  /\[\s*[\w\s,]*\s*\]/,
  /\bif\s*\(.*\)\s*\{/,
  /\bfor\s*\(.*\)\s*\{/,
  /\bwhile\s*\(.*\)\s*\{/,
  /\breturn\s+/,
  /\bconsole\.(log|error|warn)/,
  /\bprint\s*\(/,
  /\bprint\(/,
];

const JSON_PATTERNS = [/^\s*[\[{]/, /"[\w]+"\s*:/, /^\s*\{[\s\S]*\}\s*$/, /^\s*\[[\s\S]*\]\s*$/];

const URL_PATTERN = /^https?:\/\/[^\s]+$/i;

const EMAIL_PATTERNS = [
  /^Subject:\s*/im,
  /^From:\s*/im,
  /^To:\s*/im,
  /^Cc:\s*/im,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  /^Dear\s+/im,
  /^Best\s+regards/im,
  /^Sincerely/im,
];

const MEETING_PATTERNS = [
  /\bmeeting\b/i,
  /\battendees?\b/i,
  /\bagenda\b/i,
  /\btranscript\b/i,
  /\bminutes?\b/i,
  /\baction\s+items?\b/i,
  /\bfollow-?up\b/i,
  /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b\d+/i,
  /\bspeaker\s*\d+/i,
  /^[\w\s]+:\s*$/m,
];

const ARTICLE_PATTERNS = [
  /\b(article|blog|post|news|story)\b/i,
  /\bpublished\b/i,
  /\bauthor\b/i,
  /\bcomments?\b/i,
  /\bchapter\b/i,
  /\bsection\b/i,
  /^\s*#{1,6}\s+/m,
  /\bintroduction\b/i,
  /\bconclusion\b/i,
  /\breferences?\b/i,
];

function countPatternMatches(text, patterns) {
  let count = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      count++;
    }
  }
  return count;
}

function detectContentType(text) {
  if (!text || typeof text !== 'string') {
    return { type: CONTENT_TYPES.PLAIN, confidence: 0 };
  }

  const trimmed = text.trim();

  if (URL_PATTERN.test(trimmed)) {
    return { type: CONTENT_TYPES.URL, confidence: 0.95 };
  }

  const jsonMatches = countPatternMatches(trimmed, JSON_PATTERNS);
  if (jsonMatches >= 2) {
    try {
      JSON.parse(trimmed);
      return { type: CONTENT_TYPES.JSON, confidence: 0.9 };
    } catch (e) {
      if (jsonMatches >= 3) {
        return { type: CONTENT_TYPES.JSON, confidence: 0.6 };
      }
    }
  }

  const codeMatches = countPatternMatches(text, CODE_PATTERNS);
  const codeScore = codeMatches / CODE_PATTERNS.length;
  if (codeScore >= 0.15 || (codeMatches >= 3 && text.includes('{') && text.includes('}'))) {
    return { type: CONTENT_TYPES.CODE, confidence: Math.min(0.5 + codeScore, 0.95) };
  }

  const emailMatches = countPatternMatches(text, EMAIL_PATTERNS);
  if (emailMatches >= 2) {
    return { type: CONTENT_TYPES.EMAIL, confidence: Math.min(0.4 + emailMatches * 0.2, 0.9) };
  }

  const meetingMatches = countPatternMatches(text, MEETING_PATTERNS);
  if (meetingMatches >= 2) {
    return { type: CONTENT_TYPES.MEETING, confidence: Math.min(0.3 + meetingMatches * 0.15, 0.85) };
  }

  const articleMatches = countPatternMatches(text, ARTICLE_PATTERNS);
  if (articleMatches >= 2 || (text.length > 500 && articleMatches >= 1)) {
    return { type: CONTENT_TYPES.ARTICLE, confidence: Math.min(0.3 + articleMatches * 0.15, 0.8) };
  }

  return { type: CONTENT_TYPES.PLAIN, confidence: 0.5 };
}

function detectIntent(text) {
  if (!text || typeof text !== 'string') {
    return { intent: INTENTS.NONE, confidence: 0 };
  }

  const lower = text.toLowerCase();
  const intentPatterns = [
    {
      intent: INTENTS.SUMMARIZE,
      patterns: [
        /\bsummarize\b/i,
        /\bsummary\b/i,
        /\bquick\s+overview\b/i,
        /\bkey\s+points\b/i,
        /\btl;dr\b/i,
      ],
    },
    {
      intent: INTENTS.EXPLAIN,
      patterns: [/\bexplain\b/i, /\bwhat\s+is\b/i, /\bhow\s+does\b/i, /\bdescribe\b/i],
    },
    {
      intent: INTENTS.TRANSLATE,
      patterns: [
        /\btranslate\b/i,
        /\bconvert\s+to\b/i,
        /in\s+(english|spanish|french|german|chinese|japanese)/i,
      ],
    },
    {
      intent: INTENTS.FIX_GRAMMAR,
      patterns: [
        /\bfix\s+grammar\b/i,
        /\bcorrect\b/i,
        /\bspell\s+check\b/i,
        /\bfix\s+(my\s+)?(text|writing)\b/i,
      ],
    },
    {
      intent: INTENTS.ANALYZE_SENTIMENT,
      patterns: [
        /\bsentiment\b/i,
        /\bfeelings?\b/i,
        /\bemotion\b/i,
        /\b tone\b/i,
        /\bhow\s+do(es)?\s+(i|you|they|he|she)\s+feel\b/i,
      ],
    },
    {
      intent: INTENTS.EXTRACT_KEYWORDS,
      patterns: [/\bkeywords?\b/i, /\btopics?\b/i, /\bextract\b/i, /\bmain\s+points?\b/i],
    },
    {
      intent: INTENTS.GENERATE_REPLY,
      patterns: [/\breply\b/i, /\brespond\b/i, /\bwrite\s+(back|a\s+response)\b/i],
    },
    {
      intent: INTENTS.GENERATE_TITLE,
      patterns: [/\btitle\b/i, /\bheadline\b/i, /\bcreate\s+(a\s+)?title\b/i],
    },
    {
      intent: INTENTS.MEETING_NOTES,
      patterns: [/\bmeeting\s+notes?\b/i, /\bminutes\b/i, /\btranscript\b/i, /\bagenda\b/i],
    },
    {
      intent: INTENTS.QA,
      patterns: [
        /\bwhat\b/i,
        /\bwhy\b/i,
        /\bhow\b/i,
        /\bwhen\b/i,
        /\bwhere\b/i,
        /\bwho\b/i,
        /\?\s*$/,
      ],
    },
    {
      intent: INTENTS.EXPLAIN_CODE,
      patterns: [/\bcode\b/i, /\bfunction\b/i, /\bdebug\b/i, /\bexplain\s+this\b/i],
    },
  ];

  let bestIntent = INTENTS.NONE;
  let bestConfidence = 0;

  for (const { intent, patterns } of intentPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const confidence = 0.7 + Math.random() * 0.25;
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestIntent = intent;
        }
        break;
      }
    }
  }

  return { intent: bestIntent, confidence: bestConfidence };
}

function getSuggestedActions(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const { type, confidence: typeConfidence } = detectContentType(text);
  const { intent, confidence: intentConfidence } = detectIntent(text);

  const actionScores = [
    { action: 'summarize', score: typeConfidence * 0.8, baseScore: 0.3 },
    {
      action: 'explain',
      score: intentConfidence > 0 ? intentConfidence : typeConfidence * 0.5,
      baseScore: 0.2,
    },
    { action: 'translate', score: type === CONTENT_TYPES.PLAIN ? 0.3 : 0.1, baseScore: 0.1 },
    { action: 'fixGrammar', score: type === CONTENT_TYPES.EMAIL ? 0.6 : 0.2, baseScore: 0.15 },
    {
      action: 'analyzeSentiment',
      score: type === CONTENT_TYPES.EMAIL || type === CONTENT_TYPES.ARTICLE ? 0.5 : 0.2,
      baseScore: 0.1,
    },
    {
      action: 'extractKeywords',
      score: type === CONTENT_TYPES.ARTICLE ? 0.6 : typeConfidence * 0.3,
      baseScore: 0.2,
    },
    { action: 'generateReply', score: type === CONTENT_TYPES.EMAIL ? 0.7 : 0.1, baseScore: 0.1 },
    {
      action: 'generateTitle',
      score: type === CONTENT_TYPES.ARTICLE ? 0.6 : typeConfidence * 0.2,
      baseScore: 0.15,
    },
    { action: 'meetingNotes', score: type === CONTENT_TYPES.MEETING ? 0.9 : 0.1, baseScore: 0.1 },
    {
      action: 'explainCode',
      score: type === CONTENT_TYPES.CODE ? 0.9 : intent === INTENTS.EXPLAIN_CODE ? 0.7 : 0.1,
      baseScore: 0.2,
    },
    { action: 'qa', score: intent === INTENTS.QA ? 0.8 : typeConfidence * 0.3, baseScore: 0.25 },
  ];

  const scoredActions = actionScores.map(({ action, score, baseScore }) => ({
    action,
    score: Math.max(score, baseScore),
  }));

  scoredActions.sort((a, b) => b.score - a.score);

  const maxScore = scoredActions[0]?.score || 1;
  return scoredActions
    .filter(a => a.score > 0.1)
    .slice(0, 5)
    .map(a => ({
      action: a.action,
      confidence: Math.min(a.score / maxScore, 1),
    }));
}

async function smartProcess(text, processor = null) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required and must be a string');
  }

  const { type } = detectContentType(text);
  const { intent } = detectIntent(text);

  const contentTypeProcessors = {
    [CONTENT_TYPES.CODE]: async txt => {
      if (processor?.explainCode) {
        return processor.explainCode(txt);
      }
      return {
        explanation: 'Code detected. Use explainCode function for details.',
        codeType: type,
      };
    },
    [CONTENT_TYPES.EMAIL]: async txt => {
      const results = {};
      if (processor?.summarize) {
        results.summary = await processor.summarize(txt);
      }
      if (processor?.generateReply) {
        results.suggestedReply = await processor.generateReply(txt);
      }
      return results;
    },
    [CONTENT_TYPES.MEETING]: async txt => {
      if (processor?.meetingNotes) {
        return { notes: await processor.meetingNotes(txt) };
      }
      if (processor?.summarize) {
        return { summary: await processor.summarize(txt) };
      }
      return { message: 'Meeting content detected. Use meetingNotes for structured output.' };
    },
    [CONTENT_TYPES.ARTICLE]: async txt => {
      const results = {};
      if (processor?.summarize) {
        results.summary = await processor.summarize(txt);
      }
      if (processor?.extractKeywords) {
        results.keywords = await processor.extractKeywords(txt);
      }
      if (processor?.generateTitle) {
        results.title = await processor.generateTitle(txt);
      }
      return results;
    },
    [CONTENT_TYPES.URL]: async txt => {
      return { url: txt, message: 'URL detected. Fetch content for processing.' };
    },
    [CONTENT_TYPES.JSON]: async txt => {
      try {
        const parsed = JSON.parse(txt);
        return { data: parsed, format: 'JSON' };
      } catch {
        return { raw: txt, format: 'JSON (invalid)' };
      }
    },
    [CONTENT_TYPES.PLAIN]: async txt => {
      const results = {};
      if (intent !== INTENTS.NONE && processor?.[intent]) {
        results[intent] = await processor[intent](txt);
      } else if (processor?.summarize) {
        results.summary = await processor.summarize(txt);
      }
      return results;
    },
  };

  const processFn = contentTypeProcessors[type] || contentTypeProcessors[CONTENT_TYPES.PLAIN];
  return processFn(text);
}

module.exports = {
  CONTENT_TYPES,
  INTENTS,
  detectContentType,
  detectIntent,
  getSuggestedActions,
  smartProcess,
};
