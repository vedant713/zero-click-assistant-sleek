const { clipboard } = require('electron');
let last = '';
let debounceTimer = null;
let watchInterval = null;

let options = {
  debounceTime: 1500,
  minLength: 40,
};

let isPaused = false;

const SENSITIVE_PATTERNS = [
  /(password|passwd|pwd|secret)\s*[:=]\s*/i,
  /(api[_-]?key|apikey|token|secret[_-]?key|access[_-]?token)\s*[:=]\s*/i,
  /bearer\s+[a-zA-Z0-9_\-\.]+/i,
  /sk-[a-zA-Z0-9]{20,}/i,
  /(AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/i,
  /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/,
  /\b\d{3}[\s\-]?\d{2}[\s\-]?\d{4}\b/,
  /-----begin\s+(rsa|dsa|ec|openssh)\s+private\s+key-----/i,
];

function containsSensitiveData(text) {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

function maskSensitiveData(text) {
  let masked = text;
  const maskPatterns = [
    { pattern: /(password|passwd|pwd|secret)\s*[:=]\s*/i, replacement: '$1=: ' },
    {
      pattern: /(api[_-]?key|apikey|token|secret[_-]?key|access[_-]?token)\s*[:=]\s*/i,
      replacement: '$1=: ',
    },
    { pattern: /bearer\s+[a-zA-Z0-9_\-\.]+/i, replacement: 'bearer ' },
    { pattern: /sk-[a-zA-Z0-9]{20,}/i, replacement: 'sk-' },
    { pattern: /(AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/i, replacement: '$1' },
    {
      pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
      replacement: '****-****-****-****',
    },
    { pattern: /\b\d{3}[\s\-]?\d{2}[\s\-]?\d{4}\b/g, replacement: '***-**-****' },
    {
      pattern: /-----begin\s+(rsa|dsa|ec|openssh)\s+private\s+key-----/i,
      replacement: '-----begin PRIVATE KEY-----',
    },
  ];

  maskPatterns.forEach(({ pattern, replacement }) => {
    masked = masked.replace(pattern, replacement);
  });

  const sensitiveMatches = text.match(
    /(api[_-]?key|apikey|token|secret[_-]?key|access[_-]?token|bearer|sk-|password|passwd|pwd|secret)\s*[:=]?\s*/i
  );
  if (sensitiveMatches) {
    const keyMatch = text.match(/[a-zA-Z0-9_\-\.]{5,}$/m);
    if (keyMatch && keyMatch[0].length > 5) {
      masked = masked.replace(keyMatch[0], keyMatch[0].substring(0, 4) + '****');
    }
  }

  return masked;
}

function watchClipboard(callback, opts = {}) {
  const { debounceTime = 1500, minLength = 40 } = opts;
  options.debounceTime = debounceTime;
  options.minLength = minLength;

  if (watchInterval) {
    clearInterval(watchInterval);
  }

  watchInterval = setInterval(() => {
    if (isPaused) return;

    const text = clipboard.readText();
    if (text && text !== last && text.length > options.minLength) {
      if (containsSensitiveData(text)) {
        return;
      }
      last = text;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        callback(text);
      }, options.debounceTime);
    }
  }, 500);
}

function setOptions(opts) {
  if (typeof opts.debounceTime === 'number' && opts.debounceTime > 0) {
    options.debounceTime = opts.debounceTime;
  }
  if (typeof opts.minLength === 'number' && opts.minLength > 0) {
    options.minLength = opts.minLength;
  }
}

function pause() {
  isPaused = true;
}

function resume() {
  isPaused = false;
}

function getStatus() {
  return {
    isPaused,
    debounceTime: options.debounceTime,
    minLength: options.minLength,
  };
}

module.exports = {
  watchClipboard,
  setOptions,
  pause,
  resume,
  getStatus,
  containsSensitiveData,
  maskSensitiveData,
};
