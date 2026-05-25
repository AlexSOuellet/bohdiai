import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('logger', () => {
  it('info calls console.log with structured JSON', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logger.info('test message', { key: 'val' });
    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output['level']).toBe('info');
    expect(output['message']).toBe('test message');
    expect(output['key']).toBe('val');
  });

  it('warn calls console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    logger.warn('warning', { code: 42 });
    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output['level']).toBe('warn');
    expect(output['code']).toBe(42);
  });

  it('error calls console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.error('something broke', { error: 'oops' });
    expect(spy).toHaveBeenCalledOnce();
    const output = JSON.parse(spy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output['level']).toBe('error');
    expect(output['error']).toBe('oops');
  });

  it('works with no meta', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logger.info('bare message');
    const output = JSON.parse(spy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output['message']).toBe('bare message');
  });
});
