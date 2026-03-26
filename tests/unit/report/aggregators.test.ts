import { describe, it, expect } from 'vitest';
import {
  aggregateTokenStats,
  aggregateAttributionStats,
  aggregateFileStats,
  aggregateTimelineStats,
  aggregateBranchStats,
  buildReportJson,
} from '../../../src/report/aggregators.js';
import { PRICING } from '../../../src/constants.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('aggregateTokenStats', () => {
  it('should aggregate token stats from sessions', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        created_at: '2026-02-20T10:00:00Z',
        branch: 'main',
        token_usage: {
          input_tokens: 1000,
          output_tokens: 500,
          cache_read_tokens: 200,
          cache_creation_tokens: 100,
          api_call_count: 5,
        },
      },
      {
        session_id: 'sess2',
        created_at: '2026-02-21T10:00:00Z',
        branch: 'feature',
        token_usage: {
          input_tokens: 2000,
          output_tokens: 1000,
          cache_read_tokens: 300,
          cache_creation_tokens: 150,
          api_call_count: 8,
        },
      },
    ];

    const result = aggregateTokenStats(sessions);

    expect(result.total_input).toBe(3000);
    expect(result.total_output).toBe(1500);
    expect(result.total_cache_read).toBe(500);
    expect(result.total_cache_creation).toBe(250);
    expect(result.total_api_calls).toBe(13);
    expect(result.avg_input).toBe(1500);
    expect(result.avg_output).toBe(750);
    expect(result.max_output).toBe(1000);
    expect(result.min_output).toBe(500);
    expect(result.per_session).toHaveLength(2);
    expect(result.per_session[0].session_id).toBe('sess1');
    expect(result.per_session[1].output).toBe(1000);
  });

  it('should handle sessions without token_usage', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'sess1', created_at: '2026-02-20T10:00:00Z' },
    ];

    const result = aggregateTokenStats(sessions);

    expect(result.total_input).toBe(0);
    expect(result.total_output).toBe(0);
    expect(result.avg_input).toBe(0);
    expect(result.avg_output).toBe(0);
  });

  it('should use checkpoint_id as fallback for session_id', () => {
    const sessions: CheckpointMetadata[] = [
      {
        checkpoint_id: 'ckpt1',
        token_usage: { output_tokens: 100 },
      },
    ];

    const result = aggregateTokenStats(sessions);
    expect(result.per_session[0].session_id).toBe('ckpt1');
  });
});

describe('aggregateAttributionStats', () => {
  it('should aggregate attribution stats from sessions with initial_attribution', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        created_at: '2026-02-20T10:00:00Z',
        branch: 'main',
        initial_attribution: {
          agent_lines: 100,
          human_added: 20,
          human_modified: 10,
          total_committed: 130,
          agent_percentage: 76.9,
        },
      },
      {
        session_id: 'sess2',
        created_at: '2026-02-21T10:00:00Z',
        branch: 'feature',
        initial_attribution: {
          agent_lines: 200,
          human_added: 30,
          human_modified: 20,
          total_committed: 250,
          agent_percentage: 80.0,
        },
      },
    ];

    const result = aggregateAttributionStats(sessions);

    expect(result.total_agent_lines).toBe(300);
    expect(result.total_human_added).toBe(50);
    expect(result.total_human_modified).toBe(30);
    expect(result.total_committed).toBe(380);
    expect(result.avg_agent_pct).toBeCloseTo(78.45, 1);
    expect(result.sessions_count).toBe(2);
    expect(result.per_session).toHaveLength(2);
  });

  it('should filter out sessions without initial_attribution', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        initial_attribution: {
          agent_lines: 100,
          agent_percentage: 75.0,
        },
      },
      {
        session_id: 'sess2',
        // No initial_attribution
      },
    ];

    const result = aggregateAttributionStats(sessions);

    expect(result.sessions_count).toBe(1);
    expect(result.per_session).toHaveLength(1);
    expect(result.per_session[0].session_id).toBe('sess1');
  });

  it('should aggregate per_branch stats', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        branch: 'main',
        initial_attribution: { agent_percentage: 70.0 },
      },
      {
        session_id: 'sess2',
        branch: 'main',
        initial_attribution: { agent_percentage: 80.0 },
      },
      {
        session_id: 'sess3',
        branch: 'feature',
        initial_attribution: { agent_percentage: 90.0 },
      },
    ];

    const result = aggregateAttributionStats(sessions);

    expect(result.per_branch).toHaveLength(2);
    // Sorted by avg_pct descending
    expect(result.per_branch[0].branch).toBe('feature');
    expect(result.per_branch[0].avg_pct).toBe(90.0);
    expect(result.per_branch[0].count).toBe(1);
    expect(result.per_branch[1].branch).toBe('main');
    expect(result.per_branch[1].avg_pct).toBe(75.0);
    expect(result.per_branch[1].count).toBe(2);
  });
});

describe('aggregateFileStats', () => {
  it('should aggregate file stats', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        files_touched: ['src/index.ts', 'src/utils/helper.ts', 'README.md'],
      },
      {
        session_id: 'sess2',
        files_touched: ['src/index.ts', 'tests/test.ts'],
      },
    ];

    const result = aggregateFileStats(sessions);

    expect(result.total_unique_files).toBe(4);
    expect(result.all_files).toHaveLength(4);

    // src/index.ts should be counted twice
    const indexEntry = result.all_files.find(f => f.file === 'src/index.ts');
    expect(indexEntry).toBeDefined();
    expect(indexEntry?.count).toBe(2);
    expect(indexEntry?.directory).toBe('src');

    // README.md should be in root directory ('.')
    const readmeEntry = result.all_files.find(f => f.file === 'README.md');
    expect(readmeEntry?.directory).toBe('.');
  });

  it('should limit top_20 to 20 files', () => {
    const files = Array.from({ length: 30 }, (_, i) => `file${i}.ts`);
    const sessions: CheckpointMetadata[] = [{ files_touched: files }];

    const result = aggregateFileStats(sessions);

    expect(result.total_unique_files).toBe(30);
    expect(result.top_20).toHaveLength(20);
  });

  it('should aggregate by_directory stats', () => {
    const sessions: CheckpointMetadata[] = [
      {
        files_touched: ['src/a.ts', 'src/b.ts', 'tests/c.ts'],
      },
      {
        files_touched: ['src/a.ts', 'docs/d.md'],
      },
    ];

    const result = aggregateFileStats(sessions);

    expect(result.by_directory).toHaveLength(3); // src, tests, docs
    const srcDir = result.by_directory.find(d => d.directory === 'src');
    expect(srcDir).toBeDefined();
    expect(srcDir?.file_count).toBe(2); // a.ts and b.ts
    expect(srcDir?.total_touches).toBe(3); // a.ts touched twice, b.ts once
  });

  it('should handle sessions without files_touched', () => {
    const sessions: CheckpointMetadata[] = [{ session_id: 'sess1' }];

    const result = aggregateFileStats(sessions);

    expect(result.total_unique_files).toBe(0);
    expect(result.top_20).toHaveLength(0);
    expect(result.by_directory).toHaveLength(0);
  });
});

describe('aggregateTimelineStats', () => {
  it('should aggregate timeline stats', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        created_at: '2026-02-20T10:00:00Z',
        branch: 'main',
        token_usage: { output_tokens: 500, api_call_count: 5 },
        initial_attribution: { agent_percentage: 75.0 },
        files_touched: ['a.ts', 'b.ts'],
      },
      {
        session_id: 'sess2',
        created_at: '2026-02-21T14:00:00Z',
        branch: 'feature',
        token_usage: { output_tokens: 800, api_call_count: 8 },
        initial_attribution: { agent_percentage: 80.0 },
        files_touched: ['c.ts'],
      },
    ];

    const result = aggregateTimelineStats(sessions);

    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0].date).toBe('2026-02-20');
    expect(result.sessions[0].output_tokens).toBe(500);
    expect(result.sessions[0].files_count).toBe(2);
    expect(result.sessions[1].date).toBe('2026-02-21');
  });

  it('should group by_date', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        created_at: '2026-02-20T10:00:00Z',
        token_usage: { output_tokens: 500, api_call_count: 5 },
      },
      {
        session_id: 'sess2',
        created_at: '2026-02-20T15:00:00Z',
        token_usage: { output_tokens: 300, api_call_count: 3 },
      },
      {
        session_id: 'sess3',
        created_at: '2026-02-21T10:00:00Z',
        token_usage: { output_tokens: 400, api_call_count: 4 },
      },
    ];

    const result = aggregateTimelineStats(sessions);

    expect(result.by_date).toHaveLength(2);
    const day1 = result.by_date.find(d => d.date === '2026-02-20');
    expect(day1?.count).toBe(2);
    expect(day1?.total_output).toBe(800);
    expect(day1?.total_calls).toBe(8);
  });

  it('should filter out sessions without created_at', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'sess1', created_at: '2026-02-20T10:00:00Z' },
      { session_id: 'sess2' }, // No created_at
    ];

    const result = aggregateTimelineStats(sessions);

    expect(result.sessions).toHaveLength(1);
  });
});

describe('aggregateBranchStats', () => {
  it('should aggregate branch stats', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        branch: 'main',
        created_at: '2026-02-20T10:00:00Z',
        token_usage: {
          input_tokens: 1000,
          output_tokens: 500,
          cache_read_tokens: 200,
          api_call_count: 5,
        },
        initial_attribution: { agent_percentage: 75.0 },
        files_touched: ['a.ts', 'b.ts'],
      },
      {
        session_id: 'sess2',
        branch: 'main',
        created_at: '2026-02-21T10:00:00Z',
        token_usage: {
          input_tokens: 1500,
          output_tokens: 700,
          cache_read_tokens: 300,
          api_call_count: 7,
        },
        initial_attribution: { agent_percentage: 80.0 },
        files_touched: ['a.ts', 'c.ts'],
      },
      {
        session_id: 'sess3',
        branch: 'feature',
        created_at: '2026-02-22T10:00:00Z',
        token_usage: { output_tokens: 300 },
        files_touched: ['d.ts'],
      },
    ];

    const result = aggregateBranchStats(sessions);

    expect(result).toHaveLength(2);
    // Sorted by sessions count descending
    expect(result[0].branch).toBe('main');
    expect(result[0].sessions).toBe(2);
    expect(result[0].total_output).toBe(1200);
    expect(result[0].total_input).toBe(2500);
    expect(result[0].total_cache_read).toBe(500);
    expect(result[0].total_api_calls).toBe(12);
    expect(result[0].avg_agent_pct).toBe(77.5); // (75 + 80) / 2
    expect(result[0].files_count).toBe(3); // a.ts, b.ts, c.ts (unique)
    expect(result[0].first_date).toBe('2026-02-20T10:00:00Z');
    expect(result[0].last_date).toBe('2026-02-21T10:00:00Z');

    expect(result[1].branch).toBe('feature');
    expect(result[1].sessions).toBe(1);
    expect(result[1].avg_agent_pct).toBe(0); // No attribution data
  });

  it('should handle sessions without branch (default to "unknown")', () => {
    const sessions: CheckpointMetadata[] = [
      { session_id: 'sess1', token_usage: { output_tokens: 100 } },
    ];

    const result = aggregateBranchStats(sessions);

    expect(result).toHaveLength(1);
    expect(result[0].branch).toBe('unknown');
  });
});

describe('buildReportJson', () => {
  it('should build complete report JSON', () => {
    const sessions: CheckpointMetadata[] = [
      {
        session_id: 'sess1',
        created_at: '2026-02-20T10:00:00Z',
        branch: 'main',
        token_usage: {
          input_tokens: 1000,
          output_tokens: 500,
          cache_read_tokens: 200,
          cache_creation_tokens: 100,
          api_call_count: 5,
        },
        initial_attribution: {
          agent_lines: 100,
          human_added: 20,
          human_modified: 10,
          total_committed: 130,
          agent_percentage: 75.0,
        },
        files_touched: ['src/index.ts'],
      },
    ];

    const result = buildReportJson(sessions, PRICING);

    expect(result.session_count).toBe(1);
    expect(result.cost_rates.output_per_1k).toBe(PRICING.outputPer1k);
    expect(result.cost_rates.input_per_1k).toBe(PRICING.inputPer1k);
    expect(result.cost_rates.cache_read_per_1k).toBe(PRICING.cacheReadPer1k);
    expect(result.cost_rates.cache_create_per_1k).toBe(PRICING.cacheCreatePer1k);
    expect(result.generated_at).toBeDefined();
    expect(result.tokens.total_input).toBe(1000);
    expect(result.tokens.total_output).toBe(500);
    expect(result.tokens.total_cache_read).toBe(200);
    expect(result.tokens.total_cache_creation).toBe(100);
    expect(result.tokens.total_api_calls).toBe(5);
    expect(result.attribution.total_agent_lines).toBe(100);
    expect(result.attribution.avg_agent_pct).toBe(75.0);
    expect(result.files.total_unique_files).toBe(1);
    expect(result.timeline.sessions).toHaveLength(1);
    expect(result.branches).toHaveLength(1);
  });
});
