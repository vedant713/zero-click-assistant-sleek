/**
 * Configuration module for Zero-Click Assistant
 * Handles environment variables and app configuration
 */

require('dotenv').config();

const config = {
  // App settings
  app: {
    name: 'Zero-Click Assistant',
    version: process.env.npm_package_version || '1.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  
  // Ollama settings
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3:latest',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT || '60000', 10),
  },
  
  // Gemini settings
  gemini: {
    apiKey: process.env.GOOGLE_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },
  
  // Mock mode
  useMock: process.env.USE_MOCK === 'true',
  
  // Validation
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

/**
 * Validate required configuration
 * @throws {Error} If required config is missing
 */
function validateConfig() {
  const errors = [];
  
  if (!config.useMock && !config.gemini.apiKey && !config.ollama.baseUrl) {
    errors.push('Either USE_MOCK=true, GOOGLE_API_KEY, or Ollama must be configured');
  }
  
  if (config.gemini.apiKey && !config.gemini.apiKey.startsWith('AIza')) {
    errors.push('Invalid Google API key format');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
  
  return true;
}

/**
 * Get the active LLM provider
 * @returns {string} 'ollama' | 'gemini' | 'mock'
 */
function getActiveProvider() {
  if (config.useMock) return 'mock';
  
  // Check if Ollama is available (this is async, so we check config)
  if (config.ollama.baseUrl) return 'ollama';
  
  if (config.gemini.apiKey) return 'gemini';
  
  return 'mock';
}

module.exports = {
  config,
  validateConfig,
  getActiveProvider,
};
