import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFsExistsSync = vi.fn();
const mockFsReadFileSync = vi.fn();
const mockFsWriteFileSync = vi.fn();
const mockFsReaddirSync = vi.fn();
const mockFsMkdirSync = vi.fn();
const mockFsUnlinkSync = vi.fn();

vi.mock('fs', () => ({
  __esModule: true,
  existsSync: mockFsExistsSync,
  readFileSync: mockFsReadFileSync,
  writeFileSync: mockFsWriteFileSync,
  readdirSync: mockFsReaddirSync,
  mkdirSync: mockFsMkdirSync,
  unlinkSync: mockFsUnlinkSync,
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userData'),
  },
  clipboard: {
    writeText: vi.fn(),
  },
}));

vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

vi.mock('../shared/config.js', () => ({
  config: {
    ollama: { baseUrl: 'http://localhost:11434' },
    gemini: { apiKey: 'test-api-key' },
    useMock: false,
  },
}));

describe('Features Module', () => {
  let features;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFsExistsSync.mockReturnValue(true);
    mockFsReadFileSync.mockReturnValue(JSON.stringify([]));
    mockFsReaddirSync.mockReturnValue([]);
    mockFsMkdirSync.mockImplementation(() => {});
    mockFsWriteFileSync.mockImplementation(() => {});
    mockFsUnlinkSync.mockImplementation(() => {});

    vi.resetModules();
    features = await import('../shared/features.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeText', () => {
    it('should handle empty text', () => {
      const { analyzeText } = features;
      const result = analyzeText('');
      expect(result.wordCount).toBe(0);
      expect(result.charCount).toBe(0);
      expect(result.sentenceCount).toBe(0);
      expect(result.paragraphCount).toBe(0);
      expect(result.sentiment).toBe('neutral');
    });

    it('should handle short text', () => {
      const { analyzeText } = features;
      const result = analyzeText('Hello world');
      expect(result.wordCount).toBe(2);
      expect(result.charCount).toBe(11);
    });

    it('should handle long text with multiple paragraphs', () => {
      const { analyzeText } = features;
      const text = `This is the first paragraph.

This is the second paragraph.

This is the third paragraph.`;
      const result = analyzeText(text);
      expect(result.paragraphCount).toBe(3);
    });

    it('should detect positive sentiment words', () => {
      const { analyzeText } = features;
      const text = 'This is a great and excellent solution that is amazing and wonderful!';
      const result = analyzeText(text);
      expect(result.sentiment).toBe('positive');
      expect(result.positiveWords).toBe(4);
    });

    it('should detect negative sentiment words', () => {
      const { analyzeText } = features;
      const text = 'This is a terrible and awful solution that has many problems and errors.';
      const result = analyzeText(text);
      expect(result.sentiment).toBe('negative');
      expect(result.negativeWords).toBe(4);
    });

    it('should return neutral for mixed sentiment with equal counts', () => {
      const { analyzeText } = features;
      const text = 'This is great but also terrible.';
      const result = analyzeText(text);
      expect(result.sentiment).toBe('neutral');
    });
  });

  describe('History Functions', () => {
    describe('getHistory', () => {
      it('should return history combining conversations and bookmarks', () => {
        mockFsExistsSync.mockImplementation(() => true);
        mockFsReaddirSync.mockReturnValue([]);

        const { getHistory } = features;
        const result = getHistory();

        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('clearHistory', () => {
      it('should clear history when directory exists', () => {
        mockFsExistsSync.mockImplementation(path => path.includes('data'));
        mockFsReaddirSync.mockReturnValue(['conversation_123.json']);

        const { clearHistory } = features;
        const result = clearHistory();

        expect(result).toBe(true);
      });

      it('should return true when directory does not exist', () => {
        mockFsExistsSync.mockImplementation(() => false);

        const { clearHistory } = features;
        const result = clearHistory();

        expect(result).toBe(true);
      });
    });
  });

  describe('searchConversations', () => {
    it('should return empty array when no data exists', () => {
      mockFsExistsSync.mockImplementation(() => true);
      mockFsReaddirSync.mockReturnValue([]);
      mockFsReadFileSync.mockImplementation(() => JSON.stringify([]));

      const { searchConversations } = features;
      const result = searchConversations('query');

      expect(result).toEqual([]);
    });
  });

  describe('Settings Functions', () => {
    describe('getSettings', () => {
      it('should return settings with default values', () => {
        const { getSettings } = features;
        const result = getSettings();

        expect(result).toHaveProperty('theme');
        expect(result).toHaveProperty('language');
        expect(result).toHaveProperty('temperature');
        expect(result).toHaveProperty('maxTokens');
      });
    });

    describe('saveSettings', () => {
      it('should throw error for invalid temperature', () => {
        const { saveSettings } = features;

        expect(() => saveSettings({ temperature: 5 })).toThrow();
      });
    });
  });

  describe('Export Functions', () => {
    describe('exportAsJSON', () => {
      it('should export data as JSON format', () => {
        const { exportAsJSON } = features;
        const data = {
          summary: 'Test Summary',
          conversation: [{ question: 'Q1', answer: 'A1' }],
          bookmarks: [],
          history: [],
        };

        const result = exportAsJSON(data);

        expect(result).toContain('"summary": "Test Summary"');
        expect(result).toContain('"version": "1.0"');
        expect(result).toContain('"exportedAt"');
      });

      it('should export with pretty formatting by default', () => {
        const { exportAsJSON } = features;
        const result = exportAsJSON({ summary: 'Test' });
        expect(result).toContain('\n');
      });

      it('should export without pretty formatting when specified', () => {
        const { exportAsJSON } = features;
        const result = exportAsJSON({ summary: 'Test' }, { pretty: false });
        expect(result).not.toContain('\n');
      });
    });

    describe('exportAsHTML', () => {
      it('should export data as HTML format', () => {
        const { exportAsHTML } = features;
        const data = {
          summary: 'Test Summary',
          conversation: [{ question: 'What is this?', answer: 'This is a test' }],
          bookmarks: [],
        };

        const result = exportAsHTML(data);

        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('Test Summary');
        expect(result).toContain('Conversation Export');
      });

      it('should include dark theme styles by default', () => {
        const { exportAsHTML } = features;
        const result = exportAsHTML({ summary: 'Test' });

        expect(result).toContain('#1a1a2e');
        expect(result).toContain('<style>');
      });

      it('should include light theme styles when specified', () => {
        const { exportAsHTML } = features;
        const result = exportAsHTML({ summary: 'Test' }, { theme: 'light' });

        expect(result).toContain('#f5f5f5');
      });

      it('should not include styles when specified', () => {
        const { exportAsHTML } = features;
        const result = exportAsHTML({ summary: 'Test' }, { includeStyles: false });

        expect(result).not.toContain('<style>');
      });

      it('should escape HTML in content', () => {
        const { exportAsHTML } = features;
        const data = {
          summary: '<script>alert("xss")</script>',
          conversation: [{ question: 'What is >?', answer: 'A & B' }],
        };

        const result = exportAsHTML(data);

        expect(result).toContain('&lt;script&gt;');
        expect(result).toContain('&gt;?');
        expect(result).toContain('&amp;');
      });
    });
  });

  describe('getDefaultSettings', () => {
    it('should return all default settings', () => {
      const { getDefaultSettings } = features;
      const result = getDefaultSettings();

      expect(result).toHaveProperty('theme');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('autoSave');
      expect(result).toHaveProperty('maxHistory');
      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('maxTokens');
      expect(result).toHaveProperty('windowOpacity');
      expect(result).toHaveProperty('alwaysOnTop');
    });
  });

  describe('getModelOptions', () => {
    it('should return Ollama model options', () => {
      const { getModelOptions } = features;
      const result = getModelOptions();

      expect(result).toHaveProperty('ollama');
      expect(result.ollama).toContain('llama3:latest');
      expect(result.ollama).toContain('mistral:latest');
    });

    it('should return Gemini model options', () => {
      const { getModelOptions } = features;
      const result = getModelOptions();

      expect(result).toHaveProperty('gemini');
      expect(result.gemini).toContain('gemini-2.0-flash');
      expect(result.gemini).toContain('gemini-1.5-pro');
    });
  });

  describe('getAllCategories', () => {
    it('should return valid categories', () => {
      const { getAllCategories } = features;
      const result = getAllCategories();

      expect(result).toContain('general');
      expect(result).toContain('work');
      expect(result).toContain('personal');
      expect(result).toContain('research');
      expect(result).toContain('code');
      expect(result).toContain('notes');
    });
  });
});
