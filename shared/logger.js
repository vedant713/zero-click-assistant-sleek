/**
 * Logger module for Zero-Click Assistant
 * Provides structured logging with different log levels
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  _shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.logLevel];
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
  }

  error(message, error = null) {
    if (!this._shouldLog('error')) return;
    
    console.error(this._formatMessage('error', message));
    if (error) {
      if (error instanceof Error) {
        console.error(`  Error: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);
      } else {
        console.error(`  Details: ${JSON.stringify(error)}`);
      }
    }
  }

  warn(message, data = null) {
    if (!this._shouldLog('warn')) return;
    console.warn(this._formatMessage('warn', message, data));
  }

  info(message, data = null) {
    if (!this._shouldLog('info')) return;
    console.log(this._formatMessage('info', message, data));
  }

  debug(message, data = null) {
    if (!this._shouldLog('debug')) return;
    console.log(this._formatMessage('debug', message, data));
  }

  start(operation) {
    this.info(`🚀 Starting: ${operation}`);
  }

  complete(operation) {
    this.info(`✅ Completed: ${operation}`);
  }

  fail(operation, error) {
    this.error(`❌ Failed: ${operation}`, error);
  }
}

const logger = {
  app: new Logger('App'),
  ollama: new Logger('Ollama'),
  gemini: new Logger('Gemini'),
  clipboard: new Logger('Clipboard'),
  ipc: new Logger('IPC'),
};

module.exports = { Logger, logger };
