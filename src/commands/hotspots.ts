import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import { matchesBranchFilter, matchesDateFilter } from '../utils/filters.js';
import type { CheckpointMetadata, FilterOptions } from '../types.js';

export interface HotspotsOptions extends FilterOptions {
  top?: number;
  json?: boolean;
}

export interface HotspotEntry {
  file: string;
  session_count: number;
  first_seen: string;
  last_seen: string;
  avg_agent_pct: number;
  branches: string[];
}

export interface HotspotsResult {
  filters: {
    top: number;
    branch: string;
    since: string;
    until: string;
  };
  total_sessions: number;
  total_unique_files: number;
  hotspots: HotspotEntry[];
}

export function buildHotspots(
  sessions: CheckpointMetadata[],
  top: number
): HotspotsResult {
  const fileMap = new Map<string, {
    sessionCount: number;
    dates: string[];
    agentPcts: number[];
    branches: Set<string>;
  }>();

  for (const s of sessions) {
    const date = s.created_at ?? '';
    const branch = s.branch ?? 'unknown';
    const agentPct = s.initial_attribution?.agent_percentage;

    for (const file of s.files_touched ?? []) {
      if (!fileMap.has(file)) {
        fileMap.set(file, {
          sessionCount: 0,
          dates: [],
          agentPcts: [],
          branches: new Set(),
        });
      }
      const entry = fileMap.get(file)!;
      entry.sessionCount++;
      if (date) entry.dates.push(date);
      if (agentPct != null) entry.agentPcts.push(agentPct);
      entry.branches.add(branch);
    }
  }

  const hotspots: HotspotEntry[] = Array.from(fileMap.entries())
    .map(([file, data]) => {
      const sortedDates = [...data.dates].sort();
      return {
        file,
        session_count: data.sessionCount,
        first_seen: sortedDates.length > 0 ? sortedDates[0]! : 'unknown',
        last_seen: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1]! : 'unknown',
        avg_agent_pct: data.agentPcts.length > 0
          ? data.agentPcts.reduce((a, b) => a + b, 0) / data.agentPcts.length
          : 0,
        branches: [...data.branches],
      };
    })
    .sort((a, b) => b.session_count - a.session_count)
    .slice(0, top);

  return {
    filters: { top, branch: '', since: '', until: '' },
    total_sessions: sessions.length,
    total_unique_files: fileMap.size,
    hotspots,
  };
}

function renderText(result: HotspotsResult): void {
  log.plain('🔥 핫스팟 파일 분석');
  log.plain('================================');
  log.plain(
    `Filters: top=${result.filters.top} branch='${result.filters.branch || '*'}' since='${result.filters.since || '*'}' until='${result.filters.until || '*'}'`
  );
  log.plain(`총 ${result.total_sessions}개 세션 / ${result.total_unique_files}개 고유 파일`);
  log.plain('');

  if (result.hotspots.length === 0) {
    log.plain('  (핫스팟 파일 없음)');
    return;
  }

  // Header
  log.plain(`${'Sessions'.padStart(8)}  ${'AI %'.padStart(6)}  ${'Period'.padEnd(23)}  File`);
  log.plain(`${'--------'.padStart(8)}  ${'------'.padStart(6)}  ${''.padEnd(23, '-')}  ${''.padEnd(40, '-')}`);

  for (const h of result.hotspots) {
    const firstDate = h.first_seen.substring(0, 10);
    const lastDate = h.last_seen.substring(0, 10);
    const period = firstDate === lastDate ? firstDate : `${firstDate} ~ ${lastDate}`;
    log.plain(
      `${String(h.session_count).padStart(8)}  ${h.avg_agent_pct.toFixed(1).padStart(5)}%  ${period.padEnd(23)}  ${h.file}`
    );
  }

  log.plain('');
  log.plain('💡 세션 수가 높은 파일은 리팩토링 우선순위로 고려해보세요.');
}

export async function runHotspots(git: GitClient, opts: HotspotsOptions): Promise<void> {
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

  for (const metadataPath of metadataPaths) {
    try {
      const content = await git.showFile(latestHash, metadataPath);
      const metadata: CheckpointMetadata = JSON.parse(content);

      if (!matchesBranchFilter(metadata.branch, opts.branch)) continue;
      if (!matchesDateFilter(metadata.created_at, opts.since, opts.until)) continue;

      sessions.push(metadata);
    } catch {
      continue;
    }
  }

  if (sessions.length === 0) {
    if (opts.json) {
      printJson(buildHotspots([], opts.top ?? 20));
    } else {
      log.warn('조건에 맞는 checkpoint가 없습니다.');
    }
    return;
  }

  const result = buildHotspots(sessions, opts.top ?? 20);
  result.filters = {
    top: opts.top ?? 20,
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
