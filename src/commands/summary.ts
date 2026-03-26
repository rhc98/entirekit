import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import { matchesBranchFilter, matchesDateFilter } from '../utils/filters.js';
import type { CheckpointMetadata, FilterOptions } from '../types.js';

export interface SummaryOptions extends FilterOptions {
  json?: boolean;
}

interface DaySummary {
  date: string;
  session_count: number;
  branches: string[];
  total_output_tokens: number;
  total_api_calls: number;
  avg_agent_pct: number;
  files_touched: string[];
}

export interface SummaryResult {
  filters: {
    limit: number;
    branch: string;
    since: string;
    until: string;
  };
  total_days: number;
  total_sessions: number;
  days: DaySummary[];
}

export function buildSummary(sessions: CheckpointMetadata[]): SummaryResult {
  // Group by date
  const dateMap = new Map<string, CheckpointMetadata[]>();
  for (const s of sessions) {
    const date = (s.created_at ?? '').substring(0, 10);
    if (!date) continue;
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    dateMap.get(date)!.push(s);
  }

  // Build day summaries, sorted most recent first
  const days: DaySummary[] = Array.from(dateMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, daySessions]) => {
      const branches = [...new Set(daySessions.map(s => s.branch ?? 'unknown'))];
      const totalOutput = daySessions.reduce((sum, s) => sum + (s.token_usage?.output_tokens ?? 0), 0);
      const totalCalls = daySessions.reduce((sum, s) => sum + (s.token_usage?.api_call_count ?? 0), 0);

      const withAttr = daySessions.filter(s => s.initial_attribution?.agent_percentage != null);
      const avgPct = withAttr.length > 0
        ? withAttr.reduce((sum, s) => sum + (s.initial_attribution?.agent_percentage ?? 0), 0) / withAttr.length
        : 0;

      const allFiles = new Set<string>();
      for (const s of daySessions) {
        for (const f of s.files_touched ?? []) {
          allFiles.add(f);
        }
      }

      return {
        date,
        session_count: daySessions.length,
        branches,
        total_output_tokens: totalOutput,
        total_api_calls: totalCalls,
        avg_agent_pct: avgPct,
        files_touched: [...allFiles],
      };
    });

  return {
    filters: { limit: 0, branch: '', since: '', until: '' },
    total_days: days.length,
    total_sessions: sessions.length,
    days,
  };
}

function renderText(result: SummaryResult): void {
  log.plain('📅 작업 요약');
  log.plain('================================');
  log.plain(
    `Filters: limit=${result.filters.limit} branch='${result.filters.branch || '*'}' since='${result.filters.since || '*'}' until='${result.filters.until || '*'}'`
  );
  log.plain(`총 ${result.total_days}일 / ${result.total_sessions}개 세션`);
  log.plain('');

  for (const day of result.days) {
    log.plain(`📆 ${day.date} (${day.session_count}개 세션)`);
    log.plain(`   브랜치: ${day.branches.join(', ')}`);
    log.plain(`   Output: ${day.total_output_tokens.toLocaleString()} tokens | API: ${day.total_api_calls} calls | AI: ${day.avg_agent_pct.toFixed(1)}%`);
    log.plain(`   수정 파일: ${day.files_touched.length}개`);

    // Show top 5 files for the day
    if (day.files_touched.length > 0) {
      const preview = day.files_touched.slice(0, 5);
      for (const file of preview) {
        log.plain(`     - ${file}`);
      }
      if (day.files_touched.length > 5) {
        log.plain(`     ... +${day.files_touched.length - 5} more`);
      }
    }
    log.plain('');
  }
}

export async function runSummary(git: GitClient, opts: SummaryOptions): Promise<void> {
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
      printJson(buildSummary([]));
    } else {
      log.warn('조건에 맞는 checkpoint가 없습니다.');
    }
    return;
  }

  const result = buildSummary(sessions);
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
