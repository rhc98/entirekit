import { describe, it, expect } from 'vitest';
import { setDifference, buildDiffResult } from '../../../src/commands/diff.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('diff command logic', () => {
  describe('setDifference', () => {
    it('should return elements in a but not in b', () => {
      const a = ['file1.ts', 'file2.ts', 'file3.ts'];
      const b = ['file2.ts', 'file4.ts'];
      const result = setDifference(a, b);
      expect(result).toEqual(['file1.ts', 'file3.ts']);
    });

    it('should return empty array when all elements are in b', () => {
      const a = ['file1.ts', 'file2.ts'];
      const b = ['file1.ts', 'file2.ts', 'file3.ts'];
      const result = setDifference(a, b);
      expect(result).toEqual([]);
    });
  });

  describe('buildDiffResult', () => {
    it('should calculate correct deltas for token usage', () => {
      const meta1: CheckpointMetadata = {
        created_at: '2026-02-20T10:00:00Z',
        branch: 'main',
        token_usage: {
          input_tokens: 1000,
          output_tokens: 500,
          cache_read_tokens: 100,
          api_call_count: 5,
        },
        initial_attribution: {
          agent_lines: 100,
          agent_percentage: 80,
          human_modified: 20,
        },
        files_touched: ['file1.ts', 'file2.ts'],
      };

      const meta2: CheckpointMetadata = {
        created_at: '2026-02-20T11:00:00Z',
        branch: 'main',
        token_usage: {
          input_tokens: 1500,
          output_tokens: 700,
          cache_read_tokens: 150,
          api_call_count: 7,
        },
        initial_attribution: {
          agent_lines: 150,
          agent_percentage: 85,
          human_modified: 25,
        },
        files_touched: ['file2.ts', 'file3.ts'],
      };

      const result = buildDiffResult(meta1, meta2, 'abc1234', 'def5678');

      // Verify checkpoint fields carry correct values
      expect(result.checkpoint1.hash).toBe('abc1234');
      expect(result.checkpoint2.hash).toBe('def5678');
      expect(result.checkpoint1.created_at).toBe('2026-02-20T10:00:00Z');
      expect(result.checkpoint2.created_at).toBe('2026-02-20T11:00:00Z');
      expect(result.checkpoint1.branch).toBe('main');
      expect(result.checkpoint2.branch).toBe('main');

      expect(result.delta.input_tokens).toBe(500);
      expect(result.delta.output_tokens).toBe(200);
      expect(result.delta.cache_read_tokens).toBe(50);
      expect(result.delta.api_call_count).toBe(2);
      expect(result.delta.agent_percentage).toBe(5);
    });

    it('should handle negative deltas (reverse order comparison)', () => {
      const meta1: CheckpointMetadata = {
        token_usage: {
          input_tokens: 2000,
          output_tokens: 1000,
          cache_read_tokens: 300,
          api_call_count: 10,
        },
        initial_attribution: {
          agent_percentage: 90,
        },
        files_touched: ['a.ts', 'b.ts', 'c.ts'],
      };

      const meta2: CheckpointMetadata = {
        token_usage: {
          input_tokens: 500,
          output_tokens: 200,
          cache_read_tokens: 50,
          api_call_count: 3,
        },
        initial_attribution: {
          agent_percentage: 60,
        },
        files_touched: ['a.ts'],
      };

      const result = buildDiffResult(meta1, meta2, 'hash1', 'hash2');

      expect(result.delta.input_tokens).toBe(-1500);
      expect(result.delta.output_tokens).toBe(-800);
      expect(result.delta.agent_percentage).toBe(-30);
      expect(result.delta.files_removed).toEqual(['b.ts', 'c.ts']);
      expect(result.delta.files_added).toEqual([]);
    });

    it('should calculate correct file changes', () => {
      const meta1: CheckpointMetadata = {
        files_touched: ['file1.ts', 'file2.ts', 'file3.ts'],
      };

      const meta2: CheckpointMetadata = {
        files_touched: ['file2.ts', 'file3.ts', 'file4.ts', 'file5.ts'],
      };

      const result = buildDiffResult(meta1, meta2, 'hash1', 'hash2');

      expect(result.delta.files_added).toEqual(['file4.ts', 'file5.ts']);
      expect(result.delta.files_removed).toEqual(['file1.ts']);
      expect(result.delta.common_files_count).toBe(2); // file2.ts and file3.ts
    });

    it('should handle missing fields gracefully', () => {
      const meta1: CheckpointMetadata = {};
      const meta2: CheckpointMetadata = {};

      const result = buildDiffResult(meta1, meta2, 'hash1', 'hash2');

      expect(result.checkpoint1.created_at).toBe('unknown');
      expect(result.checkpoint1.branch).toBe('unknown');
      expect(result.delta.input_tokens).toBe(0);
      expect(result.delta.output_tokens).toBe(0);
      expect(result.delta.files_added).toEqual([]);
      expect(result.delta.files_removed).toEqual([]);
    });
  });
});
