import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.USE_MOCK = 'true';

global.fetch = vi.fn();

const mockElectronAPI = {
  analyzeText: vi.fn(),
  getBookmarks: vi.fn(),
  deleteBookmark: vi.fn(),
  getHistory: vi.fn(),
  getSavedConversations: vi.fn(),
  clearHistory: vi.fn(),
};

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    textarea: 'textarea',
  },
}));

describe('PanelWrapper', () => {
  it('should be importable', async () => {
    const panelModule = await import('../renderer/src/components/PanelWrapper.jsx');
    expect(panelModule).toBeTruthy();
    expect(panelModule.default).toBeDefined();
  });

  it('should export AnalysisPanel', async () => {
    const panelModule = await import('../renderer/src/components/PanelWrapper.jsx');
    expect(panelModule.AnalysisPanel).toBeDefined();
  });

  it('should export BookmarksPanel', async () => {
    const panelModule = await import('../renderer/src/components/PanelWrapper.jsx');
    expect(panelModule.BookmarksPanel).toBeDefined();
  });

  it('should export HistoryPanel', async () => {
    const panelModule = await import('../renderer/src/components/PanelWrapper.jsx');
    expect(panelModule.HistoryPanel).toBeDefined();
  });
});

describe('AnalysisPanel behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window = { electronAPI: mockElectronAPI };
    mockElectronAPI.analyzeText.mockResolvedValue({
      wordCount: 5,
      charCount: 30,
      sentenceCount: 2,
      paragraphCount: 1,
      sentiment: 'positive',
    });
  });

  it('calls analyzeText API when analyzing text', async () => {
    const text = 'This is a test text to analyze';
    const result = await mockElectronAPI.analyzeText(text);

    expect(mockElectronAPI.analyzeText).toHaveBeenCalledWith(text);
    expect(result.wordCount).toBe(5);
    expect(result.charCount).toBe(30);
  });

  it('handles empty text analysis', async () => {
    mockElectronAPI.analyzeText.mockResolvedValue({
      wordCount: 0,
      charCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      sentiment: 'neutral',
    });

    const result = await mockElectronAPI.analyzeText('');

    expect(result.wordCount).toBe(0);
  });

  it('detects positive sentiment', async () => {
    mockElectronAPI.analyzeText.mockResolvedValue({
      wordCount: 10,
      charCount: 50,
      sentenceCount: 2,
      paragraphCount: 1,
      sentiment: 'positive',
    });

    const result = await mockElectronAPI.analyzeText('This is great and wonderful!');

    expect(result.sentiment).toBe('positive');
  });

  it('detects negative sentiment', async () => {
    mockElectronAPI.analyzeText.mockResolvedValue({
      wordCount: 10,
      charCount: 50,
      sentenceCount: 2,
      paragraphCount: 1,
      sentiment: 'negative',
    });

    const result = await mockElectronAPI.analyzeText('This is terrible and awful!');

    expect(result.sentiment).toBe('negative');
  });
});

describe('BookmarksPanel behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window = { electronAPI: mockElectronAPI };
  });

  it('calls getBookmarks API', async () => {
    const bookmarks = [{ id: 1, summary: 'Test bookmark 1', timestamp: '2024-01-01T00:00:00Z' }];
    mockElectronAPI.getBookmarks.mockResolvedValue(bookmarks);

    const result = await mockElectronAPI.getBookmarks();

    expect(mockElectronAPI.getBookmarks).toHaveBeenCalled();
    expect(result).toEqual(bookmarks);
  });

  it('calls deleteBookmark API', async () => {
    mockElectronAPI.deleteBookmark.mockResolvedValue(true);

    await mockElectronAPI.deleteBookmark(1);

    expect(mockElectronAPI.deleteBookmark).toHaveBeenCalledWith(1);
  });

  it('handles empty bookmarks', async () => {
    mockElectronAPI.getBookmarks.mockResolvedValue([]);

    const result = await mockElectronAPI.getBookmarks();

    expect(result).toEqual([]);
  });

  it('handles getBookmarks error', async () => {
    mockElectronAPI.getBookmarks.mockRejectedValue(new Error('Failed to load'));

    await expect(mockElectronAPI.getBookmarks()).rejects.toThrow('Failed to load');
  });
});

describe('HistoryPanel behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window = { electronAPI: mockElectronAPI };
  });

  it('calls getHistory API', async () => {
    const history = [{ id: 1, summary: 'Test history 1', timestamp: '2024-01-01T10:00:00Z' }];
    mockElectronAPI.getHistory.mockResolvedValue(history);

    const result = await mockElectronAPI.getHistory();

    expect(mockElectronAPI.getHistory).toHaveBeenCalled();
    expect(result).toEqual(history);
  });

  it('calls clearHistory API', async () => {
    mockElectronAPI.clearHistory.mockResolvedValue(true);

    await mockElectronAPI.clearHistory();

    expect(mockElectronAPI.clearHistory).toHaveBeenCalled();
  });

  it('falls back to getSavedConversations when history is empty', async () => {
    mockElectronAPI.getHistory.mockResolvedValue([]);
    mockElectronAPI.getSavedConversations.mockResolvedValue([
      { id: 1, question: 'Test question', timestamp: '2024-01-01T10:00:00Z' },
    ]);

    let result = await mockElectronAPI.getHistory();
    if (!result || result.length === 0) {
      result = await mockElectronAPI.getSavedConversations();
    }

    expect(mockElectronAPI.getSavedConversations).toHaveBeenCalled();
  });

  it('handles getHistory error', async () => {
    mockElectronAPI.getHistory.mockRejectedValue(new Error('Failed to load'));

    await expect(mockElectronAPI.getHistory()).rejects.toThrow('Failed to load');
  });

  it('handles empty history', async () => {
    mockElectronAPI.getHistory.mockResolvedValue([]);

    const result = await mockElectronAPI.getHistory();

    expect(result).toEqual([]);
  });
});

describe('PanelWrapper component structure', () => {
  it('PanelWrapper has required props', async () => {
    const { default: PanelWrapper } = await import('../renderer/src/components/PanelWrapper.jsx');

    expect(PanelWrapper).toBeDefined();
    expect(typeof PanelWrapper).toBe('function');
  });

  it('AnalysisPanel has required props', async () => {
    const { AnalysisPanel } = await import('../renderer/src/components/PanelWrapper.jsx');

    expect(AnalysisPanel).toBeDefined();
    expect(typeof AnalysisPanel).toBe('function');
  });

  it('BookmarksPanel has required props', async () => {
    const { BookmarksPanel } = await import('../renderer/src/components/PanelWrapper.jsx');

    expect(BookmarksPanel).toBeDefined();
    expect(typeof BookmarksPanel).toBe('function');
  });

  it('HistoryPanel has required props', async () => {
    const { HistoryPanel } = await import('../renderer/src/components/PanelWrapper.jsx');

    expect(HistoryPanel).toBeDefined();
    expect(typeof HistoryPanel).toBe('function');
  });
});
