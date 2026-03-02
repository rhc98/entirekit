import { describe, it, expect } from 'vitest';
import { aggregateStats, type EnrichedMetadata } from '../../../src/commands/stats.js';

describe('aggregateStats', () => {
  it('should aggregate token usage correctly', () => {
    const sessions: EnrichedMetadata[] = [
      {
        __hash: 'abc123',
        __branch: 'main',
        __created_at: '2026-02-20T10:00:00Z',
        token_usage: {
          input_tokens: 1000,
          output_tokens: 500,
          cache_read_tokens: 100,
          api_call_count: 5,
        },
      },
      {
        __hash: 'def456',
        __branch: 'main',
        __created_at: '2026-02-20T11:00:00Z',
        token_usage: {
          input_tokens: 1500,
          output_tokens: 700,
          cache_read_tokens: 150,
          api_call_count: 7,
        },
      },
    ];

    const result = aggregateStats(sessions);

    expect(result.sessions_analyzed).toBe(2);
    expect(result.tokens.input).toBe(2500);
    expect(result.tokens.output).toBe(1200);
    expect(result.tokens.cache_read).toBe(250);
    expect(result.tokens.api_calls).toBe(12);
  });

  it('should calculate average agent percentage correctly', () => {
    const sessions: EnrichedMetadata[] = [
      {
        __hash: 'abc123',
        __branch: 'main',
        __created_at: '2026-02-20T10:00:00Z',
        initial_attribution: {
          agent_percentage: 80,
        },
      },
      {
        __hash: 'def456',
        __branch: 'main',
        __created_at: '2026-02-20T11:00:00Z',
        initial_attribution: {
          agent_percentage: 90,
        },
      },
      {
        __hash: 'ghi789',
        __branch: 'main',
        __created_at: '2026-02-20T12:00:00Z',
        initial_attribution: {
          agent_percentage: 70,
        },
      },
    ];

    const result = aggregateStats(sessions);

    expect(result.attribution.avg_agent_percentage).toBe(80);
  });

  it('should count file touches correctly and sort by frequency', () => {
    const sessions: EnrichedMetadata[] = [
      {
        __hash: 'abc123',
        __branch: 'main',
        __created_at: '2026-02-20T10:00:00Z',
        files_touched: ['file1.ts', 'file2.ts'],
      },
      {
        __hash: 'def456',
        __branch: 'main',
        __created_at: '2026-02-20T11:00:00Z',
        files_touched: ['file1.ts', 'file3.ts'],
      },
      {
        __hash: 'ghi789',
        __branch: 'main',
        __created_at: '2026-02-20T12:00:00Z',
        files_touched: ['file1.ts', 'file2.ts', 'file4.ts'],
      },
    ];

    const result = aggregateStats(sessions);

    expect(result.top_files).toEqual([
      { file: 'file1.ts', count: 3 },
      { file: 'file2.ts', count: 2 },
      { file: 'file3.ts', count: 1 },
      { file: 'file4.ts', count: 1 },
    ]);
  });

  it('should limit top files to 10', () => {
    const sessions: EnrichedMetadata[] = [
      {
        __hash: 'abc123',
        __branch: 'main',
        __created_at: '2026-02-20T10:00:00Z',
        files_touched: [
          'file1.ts',
          'file2.ts',
          'file3.ts',
          'file4.ts',
          'file5.ts',
          'file6.ts',
          'file7.ts',
          'file8.ts',
          'file9.ts',
          'file10.ts',
          'file11.ts',
          'file12.ts',
        ],
      },
    ];

    const result = aggregateStats(sessions);

    expect(result.top_files.length).toBe(10);
  });

  it('should include recent 5 sessions', () => {
    const sessions: EnrichedMetadata[] = Array.from({ length: 10 }, (_, i) => ({
      __hash: `hash${i}`,
      __branch: 'main',
      __created_at: `2026-02-20T${10 + i}:00:00Z`,
    }));

    const result = aggregateStats(sessions);

    expect(result.recent_sessions.length).toBe(5);
    expect(result.recent_sessions[0].hash).toBe('hash0');
    expect(result.recent_sessions[4].hash).toBe('hash4');
  });

  it('should handle empty sessions array', () => {
    const result = aggregateStats([]);

    expect(result.sessions_analyzed).toBe(0);
    expect(result.tokens.input).toBe(0);
    expect(result.attribution.avg_agent_percentage).toBe(0);
    expect(result.top_files).toEqual([]);
    expect(result.recent_sessions).toEqual([]);
  });

  it('should handle missing fields gracefully', () => {
    const sessions: EnrichedMetadata[] = [
      {
        __hash: 'abc123',
        __branch: 'main',
        __created_at: '2026-02-20T10:00:00Z',
      },
    ];

    const result = aggregateStats(sessions);

    expect(result.tokens.input).toBe(0);
    expect(result.attribution.total_agent_lines).toBe(0);
    expect(result.attribution.avg_agent_percentage).toBe(0);
  });
});
