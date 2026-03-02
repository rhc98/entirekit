import type { ReportData } from './aggregators.js';

export function buildCsvContent(reportData: ReportData): string {
  // Header row
  const headers = [
    'session_id',
    'created_at',
    'branch',
    'input_tokens',
    'output_tokens',
    'cache_read_tokens',
    'cache_creation_tokens',
    'api_calls',
    'agent_percentage',
    'files_count',
  ];

  // Build lookup maps from attribution and timeline
  const agentPctMap = new Map<string, number>();
  for (const s of reportData.attribution.per_session) {
    agentPctMap.set(s.session_id, s.agent_percentage);
  }

  const filesCountMap = new Map<string, number>();
  for (const s of reportData.timeline.sessions) {
    filesCountMap.set(s.session_id, s.files_count);
  }

  // Build rows from tokens.per_session
  const rows = reportData.tokens.per_session.map(s => [
    s.session_id,
    s.created_at,
    s.branch,
    s.input,
    s.output,
    s.cache_read,
    s.cache_creation,
    s.api_calls,
    agentPctMap.get(s.session_id) ?? 0,
    filesCountMap.get(s.session_id) ?? 0,
  ]);

  // CSV encode: quote strings, pass numbers through
  function csvEncode(row: (string | number)[]): string {
    return row
      .map(v => (typeof v === 'string' ? '"' + v.replace(/"/g, '""') + '"' : String(v)))
      .join(',');
  }

  return [csvEncode(headers), ...rows.map(csvEncode)].join('\n');
}
