import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH, PRICING } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import { matchesBranchFilter, matchesDateFilter } from '../utils/filters.js';
import type { CheckpointMetadata, FilterOptions } from '../types.js';

export interface CostOptions extends FilterOptions {
  json?: boolean;
}

interface SessionCost {
  session_id: string;
  created_at: string;
  branch: string;
  input_cost: number;
  output_cost: number;
  cache_read_cost: number;
  cache_creation_cost: number;
  total_cost: number;
}

export interface CostResult {
  filters: {
    limit: number;
    branch: string;
    since: string;
    until: string;
  };
  pricing: {
    input_per_1k: number;
    output_per_1k: number;
    cache_read_per_1k: number;
    cache_create_per_1k: number;
  };
  sessions_analyzed: number;
  total_cost: number;
  avg_cost_per_session: number;
  cost_breakdown: {
    input: number;
    output: number;
    cache_read: number;
    cache_creation: number;
  };
  top_sessions: SessionCost[];
}

export function calculateCosts(sessions: CheckpointMetadata[]): CostResult {
  const sessionCosts: SessionCost[] = sessions.map(s => {
    const inputCost = ((s.token_usage?.input_tokens ?? 0) / 1000) * PRICING.inputPer1k;
    const outputCost = ((s.token_usage?.output_tokens ?? 0) / 1000) * PRICING.outputPer1k;
    const cacheReadCost = ((s.token_usage?.cache_read_tokens ?? 0) / 1000) * PRICING.cacheReadPer1k;
    const cacheCreationCost = ((s.token_usage?.cache_creation_tokens ?? 0) / 1000) * PRICING.cacheCreatePer1k;

    return {
      session_id: s.session_id ?? s.checkpoint_id ?? 'unknown',
      created_at: s.created_at ?? 'unknown',
      branch: s.branch ?? 'unknown',
      input_cost: inputCost,
      output_cost: outputCost,
      cache_read_cost: cacheReadCost,
      cache_creation_cost: cacheCreationCost,
      total_cost: inputCost + outputCost + cacheReadCost + cacheCreationCost,
    };
  });

  const totalInput = sessionCosts.reduce((sum, s) => sum + s.input_cost, 0);
  const totalOutput = sessionCosts.reduce((sum, s) => sum + s.output_cost, 0);
  const totalCacheRead = sessionCosts.reduce((sum, s) => sum + s.cache_read_cost, 0);
  const totalCacheCreation = sessionCosts.reduce((sum, s) => sum + s.cache_creation_cost, 0);
  const totalCost = totalInput + totalOutput + totalCacheRead + totalCacheCreation;

  // Sort by cost descending
  const topSessions = [...sessionCosts]
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 10);

  return {
    filters: { limit: 0, branch: '', since: '', until: '' },
    pricing: {
      input_per_1k: PRICING.inputPer1k,
      output_per_1k: PRICING.outputPer1k,
      cache_read_per_1k: PRICING.cacheReadPer1k,
      cache_create_per_1k: PRICING.cacheCreatePer1k,
    },
    sessions_analyzed: sessions.length,
    total_cost: totalCost,
    avg_cost_per_session: sessions.length > 0 ? totalCost / sessions.length : 0,
    cost_breakdown: {
      input: totalInput,
      output: totalOutput,
      cache_read: totalCacheRead,
      cache_creation: totalCacheCreation,
    },
    top_sessions: topSessions,
  };
}

function renderText(result: CostResult): void {
  const fmtCost = (n: number) => '$' + n.toFixed(4);

  log.plain('💰 비용 분석');
  log.plain('================================');
  log.plain(
    `Filters: limit=${result.filters.limit} branch='${result.filters.branch || '*'}' since='${result.filters.since || '*'}' until='${result.filters.until || '*'}'`
  );
  log.plain('');

  log.plain(`📊 총 비용: $${result.total_cost.toFixed(2)}`);
  log.plain(`  세션 수: ${result.sessions_analyzed}`);
  log.plain(`  세션당 평균 비용: ${fmtCost(result.avg_cost_per_session)}`);
  log.plain('');

  log.plain('💳 비용 구성:');
  log.plain(`  Input:          ${fmtCost(result.cost_breakdown.input)} (${((result.cost_breakdown.input / Math.max(result.total_cost, 0.0001)) * 100).toFixed(1)}%)`);
  log.plain(`  Output:         ${fmtCost(result.cost_breakdown.output)} (${((result.cost_breakdown.output / Math.max(result.total_cost, 0.0001)) * 100).toFixed(1)}%)`);
  log.plain(`  Cache Read:     ${fmtCost(result.cost_breakdown.cache_read)} (${((result.cost_breakdown.cache_read / Math.max(result.total_cost, 0.0001)) * 100).toFixed(1)}%)`);
  log.plain(`  Cache Creation: ${fmtCost(result.cost_breakdown.cache_creation)} (${((result.cost_breakdown.cache_creation / Math.max(result.total_cost, 0.0001)) * 100).toFixed(1)}%)`);
  log.plain('');

  log.plain('🔥 비용 TOP 10 세션:');
  for (const session of result.top_sessions) {
    log.plain(`  ${fmtCost(session.total_cost)}  [${session.created_at.substring(0, 10)}] ${session.branch} (${session.session_id.substring(0, 8)})`);
  }
}

export async function runCost(git: GitClient, opts: CostOptions): Promise<void> {
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    throw new Error(`Checkpoint branch '${CHECKPOINT_BRANCH}' not found.`);
  }

  const allHashes = await git.logHashes(CHECKPOINT_BRANCH);
  if (allHashes.length === 0) {
    log.warn('No checkpoints found.');
    return;
  }

  const latestHash = allHashes[0]!;
  const allFiles = await git.listTree(latestHash);
  const metadataPaths = allFiles.filter(f => /\/metadata\.json$/.test(f));

  const sessions: CheckpointMetadata[] = [];
  let selected = 0;

  for (const metadataPath of metadataPaths) {
    try {
      const content = await git.showFile(latestHash, metadataPath);
      const metadata: CheckpointMetadata = JSON.parse(content);

      if (!matchesBranchFilter(metadata.branch, opts.branch)) continue;
      if (!matchesDateFilter(metadata.created_at, opts.since, opts.until)) continue;

      sessions.push(metadata);
      selected++;
      if (opts.limit && opts.limit > 0 && selected >= opts.limit) break;
    } catch {
      continue;
    }
  }

  if (sessions.length === 0) {
    if (opts.json) {
      printJson(calculateCosts([]));
    } else {
      log.warn('조건에 맞는 checkpoint가 없습니다.');
    }
    return;
  }

  const result = calculateCosts(sessions);
  result.filters = {
    limit: opts.limit ?? 0,
    branch: opts.branch ?? '',
    since: opts.since ?? '',
    until: opts.until ?? '',
  };

  if (opts.json) {
    printJson(result);
  } else {
    renderText(result);
  }
}
