import { GitClient, findMetadataPath } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import { matchesBranchFilter, matchesDateFilter } from '../utils/filters.js';
import type { CheckpointMetadata, FilterOptions } from '../types.js';

export interface StatsOptions extends FilterOptions {
  json?: boolean;
}

export type EnrichedMetadata = CheckpointMetadata & {
  __hash: string;
  __branch: string;
  __created_at: string;
};

async function collectFilteredMetadata(
  git: GitClient,
  opts: FilterOptions
): Promise<EnrichedMetadata[]> {
  const allHashes = await git.logHashes(CHECKPOINT_BRANCH);
  if (allHashes.length === 0) return [];

  const latestHash = allHashes[0]!;
  const allFiles = await git.listTree(latestHash);

  // Find all metadata.json files
  const metadataPattern = /\/metadata\.json$/;
  const metadataPaths = allFiles.filter(path => metadataPattern.test(path));

  const sessions: EnrichedMetadata[] = [];
  let selected = 0;

  for (const metadataPath of metadataPaths) {
    let metadata: CheckpointMetadata;
    try {
      const metaJson = await git.showFile(latestHash, metadataPath);
      metadata = JSON.parse(metaJson);
    } catch {
      continue;
    }

    const createdAt = metadata.created_at ?? '';
    const branch = metadata.branch ?? 'unknown';

    // Apply filters
    if (!matchesBranchFilter(branch, opts.branch)) continue;
    if (!matchesDateFilter(createdAt, opts.since, opts.until)) continue;

    // Use session directory name as hash identifier
    const parts = metadataPath.split('/');
    const hashId = parts.length >= 2 ? parts[parts.length - 2]! : metadataPath;

    sessions.push({
      ...metadata,
      __hash: hashId,
      __branch: branch,
      __created_at: createdAt,
    });

    selected++;
    if (opts.limit && opts.limit > 0 && selected >= opts.limit) {
      break;
    }
  }

  return sessions;
}

export interface StatsResult {
  filters: {
    limit: number;
    branch: string;
    since: string;
    until: string;
  };
  sessions_analyzed: number;
  tokens: {
    input: number;
    output: number;
    cache_read: number;
    api_calls: number;
  };
  attribution: {
    total_agent_lines: number;
    total_human_modified: number;
    avg_agent_percentage: number;
  };
  top_files: Array<{ file: string; count: number }>;
  recent_sessions: Array<{
    hash: string;
    created_at: string;
    branch: string;
  }>;
}

export function aggregateStats(sessions: EnrichedMetadata[]): StatsResult {
  const fileCounts = new Map<string, number>();
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalApiCalls = 0;
  let totalAgentLines = 0;
  let totalHumanModified = 0;
  const agentPercentages: number[] = [];

  for (const session of sessions) {
    totalInput += session.token_usage?.input_tokens ?? 0;
    totalOutput += session.token_usage?.output_tokens ?? 0;
    totalCacheRead += session.token_usage?.cache_read_tokens ?? 0;
    totalApiCalls += session.token_usage?.api_call_count ?? 0;

    totalAgentLines += session.initial_attribution?.agent_lines ?? 0;
    totalHumanModified += session.initial_attribution?.human_modified ?? 0;

    const agentPct = session.initial_attribution?.agent_percentage;
    if (agentPct !== undefined && agentPct !== null) {
      agentPercentages.push(agentPct);
    }

    const filesTouched = session.files_touched ?? [];
    for (const file of filesTouched) {
      fileCounts.set(file, (fileCounts.get(file) ?? 0) + 1);
    }
  }

  const avgAgentPercentage =
    agentPercentages.length > 0
      ? agentPercentages.reduce((sum, val) => sum + val, 0) / agentPercentages.length
      : 0;

  const topFiles = Array.from(fileCounts.entries())
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentSessions = sessions.slice(0, 5).map(s => ({
    hash: s.__hash,
    created_at: s.__created_at,
    branch: s.__branch,
  }));

  return {
    filters: {
      limit: 0,
      branch: '',
      since: '',
      until: '',
    },
    sessions_analyzed: sessions.length,
    tokens: {
      input: totalInput,
      output: totalOutput,
      cache_read: totalCacheRead,
      api_calls: totalApiCalls,
    },
    attribution: {
      total_agent_lines: totalAgentLines,
      total_human_modified: totalHumanModified,
      avg_agent_percentage: avgAgentPercentage,
    },
    top_files: topFiles,
    recent_sessions: recentSessions,
  };
}

function renderText(stats: StatsResult): void {
  log.plain('📊 Checkpoint 브랜치 분석 도구');
  log.plain('================================');
  log.plain(
    `Filters: limit=${stats.filters.limit} branch='${stats.filters.branch || '*'}' since='${stats.filters.since || '*'}' until='${stats.filters.until || '*'}'`
  );
  log.plain('');

  log.plain('💰 토큰 사용량 통계:');
  log.plain(`  Input tokens: ${stats.tokens.input}`);
  log.plain(`  Output tokens: ${stats.tokens.output}`);
  log.plain(`  Cache read tokens: ${stats.tokens.cache_read}`);
  log.plain(`  Total API calls: ${stats.tokens.api_calls}`);
  log.plain(`  Sessions analyzed: ${stats.sessions_analyzed}`);
  log.plain('');

  log.plain('🤖 AI 기여도 분석:');
  log.plain(`  Total agent lines: ${stats.attribution.total_agent_lines}`);
  log.plain(`  Total human modified: ${stats.attribution.total_human_modified}`);
  log.plain(`  Average AI contribution: ${stats.attribution.avg_agent_percentage.toFixed(1)}%`);
  log.plain('');

  log.plain('📝 가장 많이 터치된 파일 TOP 10:');
  for (const { file, count } of stats.top_files) {
    log.plain(`  ${count} ${file}`);
  }
  log.plain('');

  log.plain('📋 최근 5개 세션 요약:');
  for (const session of stats.recent_sessions) {
    log.plain('');
    log.plain(`--- Session (${session.hash.substring(0, 7)}) ---`);
    log.plain(`Date: ${session.created_at || 'unknown'}`);
    log.plain(`Branch: ${session.branch || 'unknown'}`);
  }
  log.plain('');
}

export async function runStats(git: GitClient, opts: StatsOptions): Promise<void> {
  // Verify checkpoint branch exists
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    throw new Error(`Checkpoint branch '${CHECKPOINT_BRANCH}' not found.`);
  }

  // Collect filtered metadata (optimized: single listTree call)
  const sessions = await collectFilteredMetadata(git, opts);

  if (sessions.length === 0) {
    if (opts.json) {
      const emptyStats = aggregateStats([]);
      emptyStats.filters = {
        limit: opts.limit ?? 10,
        branch: opts.branch ?? '',
        since: opts.since ?? '',
        until: opts.until ?? '',
      };
      printJson(emptyStats);
    } else {
      log.warn('조건에 맞는 checkpoint가 없습니다.');
    }
    return;
  }

  // Aggregate stats
  const stats = aggregateStats(sessions);
  stats.filters = {
    limit: opts.limit ?? 10,
    branch: opts.branch ?? '',
    since: opts.since ?? '',
    until: opts.until ?? '',
  };

  // Output
  if (opts.json) {
    printJson(stats);
  } else {
    renderText(stats);
  }
}
