import { describe, it, expect } from 'vitest';
import { generateHtml } from '../../../src/report/html-template.js';
import type { ReportData } from '../../../src/report/aggregators.js';

function makeMinimalReportData(): ReportData {
  return {
    generated_at: '2026-02-20T10:00:00Z',
    session_count: 1,
    cost_rates: {
      output_per_1k: 0.015,
      input_per_1k: 0.003,
      cache_read_per_1k: 0.0003,
      cache_create_per_1k: 0.00375,
    },
    tokens: {
      total_input: 1000,
      total_output: 500,
      total_cache_read: 200,
      total_cache_creation: 100,
      total_api_calls: 5,
      avg_input: 1000,
      avg_output: 500,
      max_output: 500,
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
      ],
    },
    attribution: {
      total_agent_lines: 100,
      total_human_added: 20,
      total_human_modified: 10,
      total_committed: 130,
      avg_agent_pct: 75.0,
      sessions_count: 1,
      per_session: [],
      per_branch: [],
    },
    files: {
      total_unique_files: 1,
      top_20: [],
      by_directory: [],
      all_files: [],
    },
    timeline: {
      sessions: [],
      by_date: [],
    },
    branches: [],
  };
}

describe('generateHtml', () => {
  it('should produce valid HTML with DOCTYPE', () => {
    const html = generateHtml(makeMinimalReportData());
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('</html>');
  });

  it('should embed report data as JSON in a script tag', () => {
    const html = generateHtml(makeMinimalReportData());
    expect(html).toContain('<script id="report-data" type="application/json">');
    expect(html).toContain('"session_count":1');
  });

  it('should escape < in JSON to prevent script injection', () => {
    const data = makeMinimalReportData();
    data.tokens.per_session[0]!.branch = '<script>alert("xss")</script>';

    const html = generateHtml(data);

    // Should NOT contain literal </script> inside the JSON block
    const jsonStart = html.indexOf('<script id="report-data"');
    const jsonEnd = html.indexOf('</script>', jsonStart);
    const jsonSection = html.substring(jsonStart, jsonEnd);

    expect(jsonSection).not.toContain('</script>');
    expect(jsonSection).toContain('\\u003c');
  });

  it('should contain Chart.js CDN script tag', () => {
    const html = generateHtml(makeMinimalReportData());
    expect(html).toContain('chart.js');
  });

  it('should contain all navigation tabs', () => {
    const html = generateHtml(makeMinimalReportData());
    expect(html).toContain('data-section="dashboard"');
    expect(html).toContain('data-section="tokens"');
    expect(html).toContain('data-section="attribution"');
    expect(html).toContain('data-section="files"');
    expect(html).toContain('data-section="timeline"');
    expect(html).toContain('data-section="branches"');
  });

  it('should contain escapeHtml utility function', () => {
    const html = generateHtml(makeMinimalReportData());
    expect(html).toContain('const escapeHtml');
  });
});
