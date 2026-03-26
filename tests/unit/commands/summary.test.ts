import { describe, it, expect } from 'vitest';
import { buildSummary } from '../../../src/commands/summary.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('buildSummary', () => {
  it('should group sessions by date', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        created_at: '2026-02-20T10:00:00Z',
        branch: 'main',
        token_usage: { output_tokens: 500, api_call_count: 5 },
        files_touched: ['a.ts', 'b.ts'],
      },
      {
        session_id: 'sess2',
        created_at: '2026-02-20T15:00:00Z',
        branch: 'main',
        token_usage: { output_tokens: 300, api_call_count: 3 },
        files_touched: ['b.ts', 'c.ts'],
      },
      {
        session_id: 'sess3',
        created_at: '2026-02-21T10:00:00Z',
        branch: 'feature',
        token_usage: { output_tokens: 1000, api_call_count: 10 },
        files_touched: ['d.ts'],
      },
    ];

    const result = buildSummary(sessions);

    expect(result.total_days).toBe(2);
    expect(result.total_sessions).toBe(3);

    // Most recent first
    expect(result.days[0]!.date).toBe('2026-02-21');
    expect(result.days[0]!.session_count).toBe(1);
    expect(result.days[0]!.branches).toEqual(['feature']);
    expect(result.days[0]!.total_output_tokens).toBe(1000);

    expect(result.days[1]!.date).toBe('2026-02-20');
    expect(result.days[1]!.session_count).toBe(2);
    expect(result.days[1]!.total_output_tokens).toBe(800);
    expect(result.days[1]!.total_api_calls).toBe(8);
  });

  it('should deduplicate files_touched per day', () => {
    const sessions: CheckpointMetadata[] = [
      {
        created_at: '2026-02-20T10:00:00Z',
        files_touched: ['a.ts', 'b.ts'],
      },
      {
        created_at: '2026-02-20T15:00:00Z',
        files_touched: ['b.ts', 'c.ts'],
      },
    ];

    const result = buildSummary(sessions);

    // a.ts, b.ts, c.ts (deduplicated)
    expect(result.days[0]!.files_touched).toHaveLength(3);
    expect(result.days[0]!.files_touched).toContain('a.ts');
    expect(result.days[0]!.files_touched).toContain('b.ts');
    expect(result.days[0]!.files_touched).toContain('c.ts');
  });

  it('should deduplicate branches per day', () => {
    const sessions: CheckpointMetadata[] = [
      { created_at: '2026-02-20T10:00:00Z', branch: 'main' },
      { created_at: '2026-02-20T15:00:00Z', branch: 'main' },
      { created_at: '2026-02-20T18:00:00Z', branch: 'feature' },
    ];

    const result = buildSummary(sessions);

    expect(result.days[0]!.branches).toEqual(['main', 'feature']);
  });

  it('should calculate avg_agent_pct only from sessions with attribution', () => {
    const sessions: CheckpointMetadata[] = [
      {
        created_at: '2026-02-20T10:00:00Z',
        initial_attribution: { agent_percentage: 80 },
      },
      {
        created_at: '2026-02-20T15:00:00Z',
        // No attribution
      },
    ];

    const result = buildSummary(sessions);

    expect(result.days[0]!.avg_agent_pct).toBe(80);
  });

  it('should handle empty sessions', () => {
    const result = buildSummary([]);

    expect(result.total_days).toBe(0);
    expect(result.total_sessions).toBe(0);
    expect(result.days).toEqual([]);
  });

  it('should skip sessions without created_at', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'sess1' }, // no created_at
      { session_id: 'sess2', created_at: '2026-02-20T10:00:00Z' },
    ];

    const result = buildSummary(sessions);

    expect(result.total_days).toBe(1);
    // total_sessions counts all input sessions
    expect(result.total_sessions).toBe(2);
  });
});
