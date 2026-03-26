import { describe, it, expect } from 'vitest';
import { calculateCosts } from '../../../src/commands/cost.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('calculateCosts', () => {
  it('should calculate per-session and total costs', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        created_at: '2026-02-20T10:00:00Z',
        branch: 'main',
        token_usage: {
          input_tokens: 10000,
          output_tokens: 5000,
          cache_read_tokens: 20000,
          cache_creation_tokens: 1000,
          api_call_count: 10,
        },
      },
      {
        session_id: 'sess2',
        created_at: '2026-02-21T10:00:00Z',
        branch: 'feature',
        token_usage: {
          input_tokens: 5000,
          output_tokens: 2000,
          cache_read_tokens: 10000,
          api_call_count: 5,
        },
      },
    ];

    const result = calculateCosts(sessions);

    expect(result.sessions_analyzed).toBe(2);
    expect(result.total_cost).toBeGreaterThan(0);

    // Verify cost breakdown adds up to total
    const breakdownTotal =
      result.cost_breakdown.input +
      result.cost_breakdown.output +
      result.cost_breakdown.cache_read +
      result.cost_breakdown.cache_creation;
    expect(result.total_cost).toBeCloseTo(breakdownTotal, 10);

    // avg = total / count
    expect(result.avg_cost_per_session).toBeCloseTo(result.total_cost / 2, 10);
  });

  it('should sort top sessions by cost descending', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'cheap',
        token_usage: { output_tokens: 100 },
      },
      {
        session_id: 'expensive',
        token_usage: { output_tokens: 100000 },
      },
      {
        session_id: 'medium',
        token_usage: { output_tokens: 10000 },
      },
    ];

    const result = calculateCosts(sessions);

    expect(result.top_sessions[0]!.session_id).toBe('expensive');
    expect(result.top_sessions[1]!.session_id).toBe('medium');
    expect(result.top_sessions[2]!.session_id).toBe('cheap');
  });

  it('should handle empty sessions', () => {
    const result = calculateCosts([]);

    expect(result.sessions_analyzed).toBe(0);
    expect(result.total_cost).toBe(0);
    expect(result.avg_cost_per_session).toBe(0);
    expect(result.top_sessions).toEqual([]);
  });

  it('should handle sessions with no token_usage', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'sess1' },
    ];

    const result = calculateCosts(sessions);

    expect(result.total_cost).toBe(0);
    expect(result.top_sessions[0]!.total_cost).toBe(0);
  });
});
