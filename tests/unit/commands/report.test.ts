import { describe, it, expect } from 'vitest';
import { sortSessionsMostRecent, applySessionLimit } from '../../../src/commands/report.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('report command helpers', () => {
  it('should sort sessions by created_at in descending order', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'oldest', created_at: '2026-02-01T10:00:00Z' },
      { session_id: 'newest', created_at: '2026-02-03T10:00:00Z' },
      { session_id: 'middle', created_at: '2026-02-02T10:00:00Z' },
      { session_id: 'missing-date' },
    ];

    const sorted = sortSessionsMostRecent(sessions);

    expect(sorted.map(s => s.session_id)).toEqual([
      'newest',
      'middle',
      'oldest',
      'missing-date',
    ]);
  });

  it('should apply limit after sorting', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'a', created_at: '2026-02-01T00:00:00Z' },
      { session_id: 'c', created_at: '2026-02-03T00:00:00Z' },
      { session_id: 'b', created_at: '2026-02-02T00:00:00Z' },
    ];

    const sorted = sortSessionsMostRecent(sessions);
    const limited = applySessionLimit(sorted, 2);

    expect(limited.map(s => s.session_id)).toEqual(['c', 'b']);
  });

  it('should return all sessions when limit is undefined or non-positive', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'a' },
      { session_id: 'b' },
    ];

    expect(applySessionLimit(sessions, undefined)).toHaveLength(2);
    expect(applySessionLimit(sessions, 0)).toHaveLength(2);
    expect(applySessionLimit(sessions, -1)).toHaveLength(2);
  });
});
