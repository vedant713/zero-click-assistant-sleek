import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue('Mock summary text.'),
        },
      }),
    }),
  })),
}));

describe('Summarizer Module', () => {
  let summarizer;

  beforeEach(async () => {
    vi.clearAllMocks();
    summarizer = await import('../shared/summarizer.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMockSummary', () => {
    it('should return mock summary with correct structure', () => {
      const { getMockSummary } = summarizer;
      const result = getMockSummary('Hello world this is a test');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('followUps');
      expect(result.followUps).toHaveLength(3);
    });

    it('should contain word count in summary', () => {
      const { getMockSummary } = summarizer;
      const result = getMockSummary('Hello world this is a test');
      expect(result.summary).toContain('6 words');
    });
  });

  describe('getMockAnswer', () => {
    it('should return a mock answer string', () => {
      const { getMockAnswer } = summarizer;
      const result = getMockAnswer('What is this?');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('summarizeWithGemini', () => {
    it('should return summary and follow-ups', async () => {
      const { summarizeWithGemini } = summarizer;
      const result = await summarizeWithGemini('Test text for summarization');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('followUps');
      expect(Array.isArray(result.followUps)).toBe(true);
    });
  });

  describe('qaWithGemini', () => {
    it('should return an answer string', async () => {
      const { qaWithGemini } = summarizer;
      const result = await qaWithGemini('Context here', 'What is this?');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Follow-up Question Cleanup', () => {
    it('should clean up numbered questions', () => {
      const testInput = "1. What is JavaScript?\n2. How does it work?\n3. What can you build?";
      const cleaned = testInput
        .split('\n')
        .map((q) => q.replace(/^['\''.\d\-\*\)\s]+/, '').trim())
        .filter(q => q.length > 0);
      
      expect(cleaned[0]).toBe('What is JavaScript?');
      expect(cleaned[1]).toBe('How does it work?');
    });

    it('should clean up bullet points', () => {
      const testInput = "- First question\n* Second question\n• Third question";
      const cleaned = testInput
        .split('\n')
        .map((q) => q.replace(/^['\''.\d\-\*\)\s]+/, '').trim())
        .filter(q => q.length > 0);
      
      expect(cleaned[0]).toBe('First question');
      expect(cleaned[1]).toBe('Second question');
    });
  });

  describe('Integration', () => {
    it('should export all required functions', () => {
      expect(summarizer.summarize).toBeDefined();
      expect(typeof summarizer.summarize).toBe('function');
      expect(summarizer.qa).toBeDefined();
      expect(typeof summarizer.qa).toBe('function');
      expect(summarizer.summarizeWithGemini).toBeDefined();
      expect(typeof summarizer.summarizeWithGemini).toBe('function');
      expect(summarizer.qaWithGemini).toBeDefined();
      expect(typeof summarizer.qaWithGemini).toBe('function');
      expect(summarizer.checkOllamaAvailable).toBeDefined();
      expect(typeof summarizer.checkOllamaAvailable).toBe('function');
      expect(summarizer.resetOllamaCache).toBeDefined();
      expect(typeof summarizer.resetOllamaCache).toBe('function');
      expect(summarizer.getMockSummary).toBeDefined();
      expect(typeof summarizer.getMockSummary).toBe('function');
      expect(summarizer.getMockAnswer).toBeDefined();
      expect(typeof summarizer.getMockAnswer).toBe('function');
    });
  });
});
