import { describe, it, expect } from 'vitest';
import { buildShowResult } from '../../../src/commands/show.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('buildShowResult', () => {
  it('should build complete show result from metadata', () => {
    const metadata: CheckpointMetadata = {
      session_id: 'sess-123',
      created_at: '2026-02-20T10:00:00Z',
      branch: 'main',
      token_usage: {
        input_tokens: 10000,
        output_tokens: 5000,
        cache_read_tokens: 20000,
        cache_creation_tokens: 1000,
        api_call_count: 10,
      },
      initial_attribution: {
        agent_lines: 200,
        agent_percentage: 85,
        human_added: 20,
        human_modified: 15,
        total_committed: 235,
      },
      files_touched: ['src/index.ts', 'src/utils.ts', 'README.md'],
    };

    const result = buildShowResult(metadata, 'abc1234def', 'Fix the login bug\nand add tests');

    expect(result.hash).toBe('abc1234def');
    expect(result.session_id).toBe('sess-123');
    expect(result.created_at).toBe('2026-02-20T10:00:00Z');
    expect(result.branch).toBe('main');
    expect(result.token_usage.input_tokens).toBe(10000);
    expect(result.token_usage.output_tokens).toBe(5000);
    expect(result.estimated_cost).toBeGreaterThan(0);
    expect(result.attribution.agent_lines).toBe(200);
    expect(result.attribution.agent_percentage).toBe(85);
    expect(result.files_touched).toHaveLength(3);
    expect(result.files_touched_count).toBe(3);
    expect(result.prompt_preview).toBe('Fix the login bug\nand add tests');
  });

  it('should handle missing fields gracefully', () => {
    const result = buildShowResult({}, 'hash123', '');

    expect(result.session_id).toBe('unknown');
    expect(result.created_at).toBe('unknown');
    expect(result.branch).toBe('unknown');
    expect(result.token_usage.input_tokens).toBe(0);
    expect(result.estimated_cost).toBe(0);
    expect(result.attribution.agent_lines).toBe(0);
    expect(result.files_touched).toEqual([]);
    expect(result.prompt_preview).toBe('');
  });

  it('should truncate prompt preview to 10 lines', () => {
    const longPrompt = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');

    const result = buildShowResult({}, 'hash', longPrompt);

    const lines = result.prompt_preview.split('\n');
    expect(lines).toHaveLength(10);
    expect(lines[0]).toBe('Line 1');
    expect(lines[9]).toBe('Line 10');
  });

  it('should use checkpoint_id as fallback for session_id', () => {
    const result = buildShowResult({ checkpoint_id: 'ckpt-456' }, 'hash', '');

    expect(result.session_id).toBe('ckpt-456');
  });
});
