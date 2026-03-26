import { describe, it, expect } from 'vitest';
import { buildMarkdownSummary } from '../../../src/commands/export.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('buildMarkdownSummary', () => {
  it('should produce markdown with all sections', () => {
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
      files_touched: ['src/index.ts', 'README.md'],
    };

    const md = buildMarkdownSummary(
      metadata,
      'abc1234def567',
      'Fix the login bug',
      'Some context here'
    );

    expect(md).toContain('# Checkpoint: abc1234');
    expect(md).toContain('**Session ID:** sess-123');
    expect(md).toContain('**Date:** 2026-02-20T10:00:00Z');
    expect(md).toContain('**Branch:** main');
    expect(md).toContain('## Token Usage');
    expect(md).toContain('| Input Tokens | 10000 |');
    expect(md).toContain('## AI Contribution');
    expect(md).toContain('| Agent % | 85% |');
    expect(md).toContain('## Files Touched');
    expect(md).toContain('- src/index.ts');
    expect(md).toContain('## Prompt');
    expect(md).toContain('Fix the login bug');
    expect(md).toContain('## Context');
    expect(md).toContain('Some context here');
  });

  it('should handle minimal metadata', () => {
    const md = buildMarkdownSummary({}, 'hash123', '', '');

    expect(md).toContain('# Checkpoint: hash123');
    expect(md).toContain('**Session ID:** unknown');
    expect(md).not.toContain('## Token Usage');
    expect(md).not.toContain('## AI Contribution');
    expect(md).not.toContain('## Files Touched');
    expect(md).not.toContain('## Prompt');
    expect(md).not.toContain('## Context');
  });

  it('should include token usage section when present', () => {
    const md = buildMarkdownSummary(
      { token_usage: { output_tokens: 500 } },
      'hash',
      '',
      ''
    );

    expect(md).toContain('## Token Usage');
    expect(md).toContain('| Output Tokens | 500 |');
  });

  it('should include files section when files_touched is non-empty', () => {
    const md = buildMarkdownSummary(
      { files_touched: ['a.ts', 'b.ts'] },
      'hash',
      '',
      ''
    );

    expect(md).toContain('## Files Touched');
    expect(md).toContain('- a.ts');
    expect(md).toContain('- b.ts');
  });
});
