import { describe, it, expect } from 'vitest';
import { buildTimeline } from '../../../src/commands/timeline.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('buildTimeline', () => {
  it('should group sessions by date', () => {
    const sessions: CheckpointMetadata[] = [
      { created_at: '2026-02-20T10:00:00Z' },
      { created_at: '2026-02-20T15:00:00Z' },
      { created_at: '2026-02-21T10:00:00Z' },
    ];

    const result = buildTimeline(sessions, 12);

    expect(result.total_sessions).toBe(3);
    expect(result.by_date).toHaveLength(2);

    const day1 = result.by_date.find(d => d.date === '2026-02-20');
    expect(day1!.count).toBe(2);

    const day2 = result.by_date.find(d => d.date === '2026-02-21');
    expect(day2!.count).toBe(1);
  });

  it('should find most active day', () => {
    const sessions: CheckpointMetadata[] = [
      { created_at: '2026-02-20T10:00:00Z' },
      { created_at: '2026-02-21T10:00:00Z' },
      { created_at: '2026-02-21T15:00:00Z' },
      { created_at: '2026-02-21T18:00:00Z' },
    ];

    const result = buildTimeline(sessions, 12);

    expect(result.most_active_day.date).toBe('2026-02-21');
    expect(result.most_active_day.count).toBe(3);
  });

  it('should calculate longest streak', () => {
    const sessions: CheckpointMetadata[] = [
      { created_at: '2026-02-20T10:00:00Z' },
      { created_at: '2026-02-21T10:00:00Z' },
      { created_at: '2026-02-22T10:00:00Z' },
      // gap on 2026-02-23
      { created_at: '2026-02-24T10:00:00Z' },
      { created_at: '2026-02-25T10:00:00Z' },
    ];

    const result = buildTimeline(sessions, 12);

    expect(result.longest_streak).toBe(3); // Feb 20-22
  });

  it('should handle empty sessions', () => {
    const result = buildTimeline([], 12);

    expect(result.total_sessions).toBe(0);
    expect(result.most_active_day).toEqual({ date: '-', count: 0 });
    expect(result.current_streak).toBe(0);
    expect(result.longest_streak).toBe(0);
    expect(result.by_date).toEqual([]);
  });

  it('should skip sessions without created_at', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'no-date' },
      { created_at: '2026-02-20T10:00:00Z' },
    ];

    const result = buildTimeline(sessions, 12);

    expect(result.by_date).toHaveLength(1);
    expect(result.total_sessions).toBe(2); // counts all input
  });

  it('should sort by_date chronologically', () => {
    const sessions: CheckpointMetadata[] = [
      { created_at: '2026-02-22T10:00:00Z' },
      { created_at: '2026-02-20T10:00:00Z' },
      { created_at: '2026-02-21T10:00:00Z' },
    ];

    const result = buildTimeline(sessions, 12);

    expect(result.by_date[0]!.date).toBe('2026-02-20');
    expect(result.by_date[1]!.date).toBe('2026-02-21');
    expect(result.by_date[2]!.date).toBe('2026-02-22');
  });
});
