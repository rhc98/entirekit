import { describe, it, expect } from 'vitest';
import { buildHotspots } from '../../../src/commands/hotspots.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('buildHotspots', () => {
  it('should rank files by session count', () => {
    const sessions: CheckpointMetadata[] = [
      {
        created_at: '2026-02-20T10:00:00Z',
        branch: 'main',
        files_touched: ['src/index.ts', 'src/utils.ts'],
      },
      {
        created_at: '2026-02-21T10:00:00Z',
        branch: 'main',
        files_touched: ['src/index.ts', 'README.md'],
      },
      {
        created_at: '2026-02-22T10:00:00Z',
        branch: 'feature',
        files_touched: ['src/index.ts', 'src/utils.ts', 'test.ts'],
      },
    ];

    const result = buildHotspots(sessions, 20);

    expect(result.total_sessions).toBe(3);
    expect(result.total_unique_files).toBe(4);
    expect(result.hotspots[0]!.file).toBe('src/index.ts');
    expect(result.hotspots[0]!.session_count).toBe(3);
    expect(result.hotspots[1]!.file).toBe('src/utils.ts');
    expect(result.hotspots[1]!.session_count).toBe(2);
  });

  it('should track first_seen and last_seen dates', () => {
    const sessions: CheckpointMetadata[] = [
      {
        created_at: '2026-02-20T10:00:00Z',
        files_touched: ['a.ts'],
      },
      {
        created_at: '2026-02-25T10:00:00Z',
        files_touched: ['a.ts'],
      },
    ];

    const result = buildHotspots(sessions, 20);

    expect(result.hotspots[0]!.first_seen).toBe('2026-02-20T10:00:00Z');
    expect(result.hotspots[0]!.last_seen).toBe('2026-02-25T10:00:00Z');
  });

  it('should calculate avg_agent_pct from sessions with attribution', () => {
    const sessions: CheckpointMetadata[] = [
      {
        created_at: '2026-02-20T10:00:00Z',
        initial_attribution: { agent_percentage: 80 },
        files_touched: ['a.ts'],
      },
      {
        created_at: '2026-02-21T10:00:00Z',
        initial_attribution: { agent_percentage: 60 },
        files_touched: ['a.ts'],
      },
      {
        created_at: '2026-02-22T10:00:00Z',
        // no attribution
        files_touched: ['a.ts'],
      },
    ];

    const result = buildHotspots(sessions, 20);

    // Average of 80 and 60 (third session excluded)
    expect(result.hotspots[0]!.avg_agent_pct).toBe(70);
  });

  it('should collect unique branches per file', () => {
    const sessions: CheckpointMetadata[] = [
      { branch: 'main', files_touched: ['a.ts'] },
      { branch: 'main', files_touched: ['a.ts'] },
      { branch: 'feature', files_touched: ['a.ts'] },
    ];

    const result = buildHotspots(sessions, 20);

    expect(result.hotspots[0]!.branches).toEqual(['main', 'feature']);
  });

  it('should respect top limit', () => {
    const sessions: CheckpointMetadata[] = [
      {
        files_touched: Array.from({ length: 10 }, (_, i) => `file${i}.ts`),
      },
    ];

    const result = buildHotspots(sessions, 3);

    expect(result.hotspots).toHaveLength(3);
  });

  it('should handle empty sessions', () => {
    const result = buildHotspots([], 20);

    expect(result.total_sessions).toBe(0);
    expect(result.total_unique_files).toBe(0);
    expect(result.hotspots).toEqual([]);
  });
});
