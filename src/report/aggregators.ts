import type { CheckpointMetadata } from '../types.js';
import { PRICING } from '../constants.js';

// Token stats — matches aggregate_token_stats() in bash
export interface TokenStats {
  total_input: number;
  total_output: number;
  total_cache_read: number;
  total_cache_creation: number;
  total_api_calls: number;
  avg_input: number;
  avg_output: number;
  max_output: number;
  min_output: number;
  per_session: Array<{
    session_id: string;
    created_at: string;
    branch: string;
    input: number;
    output: number;
    cache_read: number;
    cache_creation: number;
    api_calls: number;
  }>;
}

// Attribution stats — matches aggregate_attribution_stats() in bash
export interface AttributionStats {
  total_agent_lines: number;
  total_human_added: number;
  total_human_modified: number;
  total_committed: number;
  avg_agent_pct: number;
  sessions_count: number;
  per_session: Array<{
    session_id: string;
    created_at: string;
    branch: string;
    agent_lines: number;
    human_added: number;
    human_modified: number;
    total_committed: number;
    agent_percentage: number;
  }>;
  per_branch: Array<{
    branch: string;
    avg_pct: number;
    count: number;
  }>;
}

// File stats — matches aggregate_file_stats() in bash
export interface FileStats {
  total_unique_files: number;
  top_20: Array<{ file: string; count: number; directory: string }>;
  by_directory: Array<{ directory: string; file_count: number; total_touches: number }>;
  all_files: Array<{ file: string; count: number; directory: string }>;
}

// Timeline stats — matches aggregate_timeline_stats() in bash
export interface TimelineStats {
  sessions: Array<{
    session_id: string;
    created_at: string;
    date: string;
    branch: string;
    output_tokens: number;
    api_calls: number;
    agent_pct: number;
    files_count: number;
  }>;
  by_date: Array<{
    date: string;
    count: number;
    total_output: number;
    total_calls: number;
  }>;
}

// Branch stats — matches aggregate_branch_stats() in bash
export interface BranchStats {
  branch: string;
  sessions: number;
  total_output: number;
  total_input: number;
  total_cache_read: number;
  total_api_calls: number;
  avg_agent_pct: number;
  files_count: number;
  first_date: string;
  last_date: string;
}

export interface ReportData {
  generated_at: string;
  session_count: number;
  cost_rates: {
    output_per_1k: number;
    input_per_1k: number;
    cache_read_per_1k: number;
    cache_create_per_1k: number;
  };
  tokens: TokenStats;
  attribution: AttributionStats;
  files: FileStats;
  timeline: TimelineStats;
  branches: BranchStats[];
}

export function aggregateTokenStats(sessions: CheckpointMetadata[]): TokenStats {
  const perSession = sessions.map(s => ({
    session_id: s.session_id ?? s.checkpoint_id ?? 'unknown',
    created_at: s.created_at ?? 'unknown',
    branch: s.branch ?? 'unknown',
    input: s.token_usage?.input_tokens ?? 0,
    output: s.token_usage?.output_tokens ?? 0,
    cache_read: s.token_usage?.cache_read_tokens ?? 0,
    cache_creation: s.token_usage?.cache_creation_tokens ?? 0,
    api_calls: s.token_usage?.api_call_count ?? 0,
  }));

  const totalInput = perSession.reduce((sum, s) => sum + s.input, 0);
  const totalOutput = perSession.reduce((sum, s) => sum + s.output, 0);
  const totalCacheRead = perSession.reduce((sum, s) => sum + s.cache_read, 0);
  const totalCacheCreation = perSession.reduce((sum, s) => sum + s.cache_creation, 0);
  const totalApiCalls = perSession.reduce((sum, s) => sum + s.api_calls, 0);

  const sessionCount = Math.max(sessions.length, 1);
  const outputTokens = perSession.map(s => s.output);

  return {
    total_input: totalInput,
    total_output: totalOutput,
    total_cache_read: totalCacheRead,
    total_cache_creation: totalCacheCreation,
    total_api_calls: totalApiCalls,
    avg_input: totalInput / sessionCount,
    avg_output: totalOutput / sessionCount,
    max_output: outputTokens.length > 0 ? Math.max(...outputTokens) : 0,
    min_output: outputTokens.length > 0 ? Math.min(...outputTokens) : 0,
    per_session: perSession,
  };
}

export function aggregateAttributionStats(sessions: CheckpointMetadata[]): AttributionStats {
  const withAttribution = sessions.filter(s => s.initial_attribution != null);

  const perSession = withAttribution.map(s => ({
    session_id: s.session_id ?? s.checkpoint_id ?? 'unknown',
    created_at: s.created_at ?? 'unknown',
    branch: s.branch ?? 'unknown',
    agent_lines: s.initial_attribution?.agent_lines ?? 0,
    human_added: s.initial_attribution?.human_added ?? 0,
    human_modified: s.initial_attribution?.human_modified ?? 0,
    total_committed: s.initial_attribution?.total_committed ?? 0,
    agent_percentage: s.initial_attribution?.agent_percentage ?? 0,
  }));

  const totalAgentLines = perSession.reduce((sum, s) => sum + s.agent_lines, 0);
  const totalHumanAdded = perSession.reduce((sum, s) => sum + s.human_added, 0);
  const totalHumanModified = perSession.reduce((sum, s) => sum + s.human_modified, 0);
  const totalCommitted = perSession.reduce((sum, s) => sum + s.total_committed, 0);

  const avgAgentPct = perSession.length > 0
    ? perSession.reduce((sum, s) => sum + s.agent_percentage, 0) / perSession.length
    : 0;

  // Group by branch
  const branchMap = new Map<string, { pcts: number[]; count: number }>();
  withAttribution.forEach(s => {
    const branch = s.branch ?? 'unknown';
    const pct = s.initial_attribution?.agent_percentage ?? 0;
    if (!branchMap.has(branch)) {
      branchMap.set(branch, { pcts: [], count: 0 });
    }
    const entry = branchMap.get(branch)!;
    entry.pcts.push(pct);
    entry.count++;
  });

  const perBranch = Array.from(branchMap.entries())
    .map(([branch, data]) => ({
      branch,
      avg_pct: data.pcts.reduce((sum, pct) => sum + pct, 0) / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.avg_pct - a.avg_pct);

  return {
    total_agent_lines: totalAgentLines,
    total_human_added: totalHumanAdded,
    total_human_modified: totalHumanModified,
    total_committed: totalCommitted,
    avg_agent_pct: avgAgentPct,
    sessions_count: withAttribution.length,
    per_session: perSession,
    per_branch: perBranch,
  };
}

export function aggregateFileStats(sessions: CheckpointMetadata[]): FileStats {
  // Flatten all files
  const allFilesFlat: string[] = [];
  sessions.forEach(s => {
    if (s.files_touched) {
      allFilesFlat.push(...s.files_touched);
    }
  });

  // Count occurrences
  const fileCountMap = new Map<string, number>();
  allFilesFlat.forEach(file => {
    fileCountMap.set(file, (fileCountMap.get(file) ?? 0) + 1);
  });

  // Convert to array with directory info
  const allFiles = Array.from(fileCountMap.entries())
    .map(([file, count]) => {
      const parts = file.split('/');
      const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
      return { file, count, directory };
    })
    .sort((a, b) => b.count - a.count);

  const top20 = allFiles.slice(0, 20);

  // Group by directory
  const dirMap = new Map<string, { files: Set<string>; totalTouches: number }>();
  allFiles.forEach(({ file, count, directory }) => {
    if (!dirMap.has(directory)) {
      dirMap.set(directory, { files: new Set(), totalTouches: 0 });
    }
    const entry = dirMap.get(directory)!;
    entry.files.add(file);
    entry.totalTouches += count;
  });

  const byDirectory = Array.from(dirMap.entries())
    .map(([directory, data]) => ({
      directory,
      file_count: data.files.size,
      total_touches: data.totalTouches,
    }))
    .sort((a, b) => b.total_touches - a.total_touches)
    .slice(0, 15);

  return {
    total_unique_files: allFiles.length,
    top_20: top20,
    by_directory: byDirectory,
    all_files: allFiles,
  };
}

export function aggregateTimelineStats(sessions: CheckpointMetadata[]): TimelineStats {
  const withCreatedAt = sessions.filter(s => s.created_at != null);

  // Sort by created_at
  const sorted = [...withCreatedAt].sort((a, b) => {
    const dateA = a.created_at ?? '';
    const dateB = b.created_at ?? '';
    return dateA.localeCompare(dateB);
  });

  const timelineSessions = sorted.map(s => ({
    session_id: s.session_id ?? s.checkpoint_id ?? 'unknown',
    created_at: s.created_at ?? 'unknown',
    date: (s.created_at ?? '').substring(0, 10),
    branch: s.branch ?? 'unknown',
    output_tokens: s.token_usage?.output_tokens ?? 0,
    api_calls: s.token_usage?.api_call_count ?? 0,
    agent_pct: s.initial_attribution?.agent_percentage ?? 0,
    files_count: s.files_touched?.length ?? 0,
  }));

  // Group by date
  const dateMap = new Map<string, { count: number; totalOutput: number; totalCalls: number }>();
  sorted.forEach(s => {
    const date = (s.created_at ?? '').substring(0, 10);
    if (!dateMap.has(date)) {
      dateMap.set(date, { count: 0, totalOutput: 0, totalCalls: 0 });
    }
    const entry = dateMap.get(date)!;
    entry.count++;
    entry.totalOutput += s.token_usage?.output_tokens ?? 0;
    entry.totalCalls += s.token_usage?.api_call_count ?? 0;
  });

  const byDate = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      total_output: data.totalOutput,
      total_calls: data.totalCalls,
    }));

  return {
    sessions: timelineSessions,
    by_date: byDate,
  };
}

export function aggregateBranchStats(sessions: CheckpointMetadata[]): BranchStats[] {
  // Group by branch
  const branchMap = new Map<string, CheckpointMetadata[]>();
  sessions.forEach(s => {
    const branch = s.branch ?? 'unknown';
    if (!branchMap.has(branch)) {
      branchMap.set(branch, []);
    }
    branchMap.get(branch)!.push(s);
  });

  const branchStats = Array.from(branchMap.entries()).map(([branch, branchSessions]) => {
    const totalOutput = branchSessions.reduce((sum, s) => sum + (s.token_usage?.output_tokens ?? 0), 0);
    const totalInput = branchSessions.reduce((sum, s) => sum + (s.token_usage?.input_tokens ?? 0), 0);
    const totalCacheRead = branchSessions.reduce((sum, s) => sum + (s.token_usage?.cache_read_tokens ?? 0), 0);
    const totalApiCalls = branchSessions.reduce((sum, s) => sum + (s.token_usage?.api_call_count ?? 0), 0);

    // Calculate avg_agent_pct only for sessions with attribution
    const withAttr = branchSessions.filter(s => s.initial_attribution != null);
    const avgAgentPct = withAttr.length > 0
      ? withAttr.reduce((sum, s) => sum + (s.initial_attribution?.agent_percentage ?? 0), 0) / withAttr.length
      : 0;

    // Unique files across all sessions in this branch
    const allFiles = new Set<string>();
    branchSessions.forEach(s => {
      if (s.files_touched) {
        s.files_touched.forEach(file => allFiles.add(file));
      }
    });

    // First and last dates
    const dates = branchSessions
      .map(s => s.created_at)
      .filter((d): d is string => d != null)
      .sort();
    const firstDate: string = dates.length > 0 ? dates[0]! : 'unknown';
    const lastDate: string = dates.length > 0 ? dates[dates.length - 1]! : 'unknown';

    return {
      branch,
      sessions: branchSessions.length,
      total_output: totalOutput,
      total_input: totalInput,
      total_cache_read: totalCacheRead,
      total_api_calls: totalApiCalls,
      avg_agent_pct: avgAgentPct,
      files_count: allFiles.size,
      first_date: firstDate,
      last_date: lastDate,
    };
  });

  // Sort by session count descending
  return branchStats.sort((a, b) => b.sessions - a.sessions);
}

export function buildReportJson(sessions: CheckpointMetadata[], pricing: typeof PRICING): ReportData {
  return {
    generated_at: new Date().toISOString(),
    session_count: sessions.length,
    cost_rates: {
      output_per_1k: pricing.outputPer1k,
      input_per_1k: pricing.inputPer1k,
      cache_read_per_1k: pricing.cacheReadPer1k,
      cache_create_per_1k: pricing.cacheCreatePer1k,
    },
    tokens: aggregateTokenStats(sessions),
    attribution: aggregateAttributionStats(sessions),
    files: aggregateFileStats(sessions),
    timeline: aggregateTimelineStats(sessions),
    branches: aggregateBranchStats(sessions),
  };
}
