import { vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.USE_MOCK = 'true';

global.fetch = vi.fn();
