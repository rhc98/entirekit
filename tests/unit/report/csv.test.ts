import { describe, it, expect } from 'vitest';
import { buildCsvContent } from '../../../src/report/csv.js';
import type { ReportData } from '../../../src/report/aggregators.js';

function makeReportData(overrides?: Partial<ReportData>): ReportData {
  return {
    generated_at: '2026-02-20T10:00:00Z',
    session_count: 2,
    cost_rates: {
      output_per_1k: 0.015,
      input_per_1k: 0.003,
      cache_read_per_1k: 0.0003,
      cache_create_per_1k: 0.00375,
    },
    tokens: {
      total_input: 3000,
      total_output: 1500,
      total_cache_read: 500,
      total_cache_creation: 250,
      total_api_calls: 13,
      avg_input: 1500,
      avg_output: 750,
      max_output: 1000,
      min_output: 500,
      per_session: [
        {
          session_id: 'sess1',
          created_at: '2026-02-20T10:00:00Z',
          branch: 'main',
          input: 1000,
          output: 500,
          cache_read: 200,
          cache_creation: 100,
          api_calls: 5,
        },
        {
          session_id: 'sess2',
          created_at: '2026-02-21T10:00:00Z',
          branch: 'feature',
          input: 2000,
          output: 1000,
          cache_read: 300,
          cache_creation: 150,
          api_calls: 8,
        },
      ],
    },
    attribution: {
      total_agent_lines: 300,
      total_human_added: 50,
      total_human_modified: 30,
      total_committed: 380,
      avg_agent_pct: 78.45,
      sessions_count: 2,
      per_session: [
        {
          session_id: 'sess1',
          created_at: '2026-02-20T10:00:00Z',
          branch: 'main',
          agent_lines: 100,
          human_added: 20,
          human_modified: 10,
          total_committed: 130,
          agent_percentage: 76.9,
        },
        {
          session_id: 'sess2',
          created_at: '2026-02-21T10:00:00Z',
          branch: 'feature',
          agent_lines: 200,
          human_added: 30,
          human_modified: 20,
          total_committed: 250,
          agent_percentage: 80.0,
        },
      ],
      per_branch: [],
    },
    files: {
      total_unique_files: 2,
      top_20: [],
      by_directory: [],
      all_files: [],
    },
    timeline: {
      sessions: [
        {
          session_id: 'sess1',
          created_at: '2026-02-20T10:00:00Z',
          date: '2026-02-20',
          branch: 'main',
          output_tokens: 500,
          api_calls: 5,
          agent_pct: 76.9,
          files_count: 3,
        },
        {
          session_id: 'sess2',
          created_at: '2026-02-21T10:00:00Z',
          date: '2026-02-21',
          branch: 'feature',
          output_tokens: 1000,
          api_calls: 8,
          agent_pct: 80.0,
          files_count: 2,
        },
      ],
      by_date: [],
    },
    branches: [],
    ...overrides,
  };
}

describe('buildCsvContent', () => {
  it('should include correct header row', () => {
    const csv = buildCsvContent(makeReportData());
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      '"session_id","created_at","branch","input_tokens","output_tokens","cache_read_tokens","cache_creation_tokens","api_calls","agent_percentage","files_count"'
    );
  });

  it('should produce correct data rows', () => {
    const csv = buildCsvContent(makeReportData());
    const lines = csv.split('\n');

    expect(lines).toHaveLength(3); // header + 2 data rows

    // First data row
    expect(lines[1]).toBe(
      '"sess1","2026-02-20T10:00:00Z","main",1000,500,200,100,5,76.9,3'
    );
    // Second data row
    expect(lines[2]).toBe(
      '"sess2","2026-02-21T10:00:00Z","feature",2000,1000,300,150,8,80,2'
    );
  });

  it('should escape double quotes in string values', () => {
    const data = makeReportData();
    data.tokens.per_session[0]!.branch = 'feature/"test"';
    const csv = buildCsvContent(data);
    const lines = csv.split('\n');

    // Should double the quotes
    expect(lines[1]).toContain('"feature/""test"""');
  });

  it('should handle empty per_session', () => {
    const data = makeReportData();
    data.tokens.per_session = [];
    const csv = buildCsvContent(data);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(1); // header only
  });

  it('should default agent_percentage to 0 when not in attribution map', () => {
    const data = makeReportData();
    data.attribution.per_session = []; // no attribution data
    const csv = buildCsvContent(data);
    const lines = csv.split('\n');

    // Both rows should have 0 for agent_percentage
    expect(lines[1]).toContain(',0,');
    expect(lines[2]).toContain(',0,');
  });
});
