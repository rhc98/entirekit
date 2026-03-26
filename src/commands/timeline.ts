import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import { matchesBranchFilter, matchesDateFilter } from '../utils/filters.js';
import type { CheckpointMetadata, FilterOptions } from '../types.js';
import chalk from 'chalk';

export interface TimelineOptions extends FilterOptions {
  weeks?: number;
  json?: boolean;
}

export interface TimelineResult {
  weeks: number;
  total_sessions: number;
  most_active_day: { date: string; count: number };
  current_streak: number;
  longest_streak: number;
  by_date: Array<{ date: string; count: number }>;
}

export function buildTimeline(
  sessions: CheckpointMetadata[],
  weeks: number
): TimelineResult {
  // Build date count map
  const dateMap = new Map<string, number>();
  for (const s of sessions) {
    const date = (s.created_at ?? '').substring(0, 10);
    if (!date) continue;
    dateMap.set(date, (dateMap.get(date) ?? 0) + 1);
  }

  const byDate = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Most active day
  let mostActive = { date: '-', count: 0 };
  for (const d of byDate) {
    if (d.count > mostActive.count) {
      mostActive = d;
    }
  }

  // Calculate streaks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Walk backwards from today for current streak
  const checkDate = new Date(today);
  // Start from today
  while (true) {
    const dateStr = checkDate.toISOString().substring(0, 10);
    if (dateMap.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Walk all dates for longest streak
  if (byDate.length > 0) {
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < byDate.length; i++) {
      const prev = new Date(byDate[i - 1]!.date);
      const curr = new Date(byDate[i]!.date);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
  }

  return {
    weeks,
    total_sessions: sessions.length,
    most_active_day: mostActive,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    by_date: byDate,
  };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BLOCKS = [' ', '░', '▒', '▓', '█'];

function renderText(result: TimelineResult): void {
  log.plain('📅 활동 타임라인');
  log.plain('================================');
  log.plain('');

  const dateMap = new Map<string, number>();
  for (const d of result.by_date) {
    dateMap.set(d.date, d.count);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate start date: go back N weeks, align to Sunday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - result.weeks * 7 + (7 - startDate.getDay()));

  // Find max count for scaling
  const maxCount = Math.max(
    1,
    ...Array.from(dateMap.values())
  );

  // Build grid: 7 rows (Sun-Sat) x N columns (weeks)
  const grid: string[][] = [];
  for (let row = 0; row < 7; row++) {
    grid.push([]);
  }

  const d = new Date(startDate);
  while (d <= today) {
    const dateStr = d.toISOString().substring(0, 10);
    const count = dateMap.get(dateStr) ?? 0;
    const dayOfWeek = d.getDay();

    let level = 0;
    if (count > 0) {
      const ratio = count / maxCount;
      if (ratio <= 0.25) level = 1;
      else if (ratio <= 0.5) level = 2;
      else if (ratio <= 0.75) level = 3;
      else level = 4;
    }

    const block = BLOCKS[level]!;
    const coloredBlock = level === 0
      ? chalk.dim(block)
      : level <= 2
        ? chalk.green(block)
        : chalk.greenBright(block);

    grid[dayOfWeek]!.push(coloredBlock);
    d.setDate(d.getDate() + 1);
  }

  // Render grid
  for (let row = 0; row < 7; row++) {
    const label = DAY_LABELS[row]!.padEnd(4);
    log.plain(`  ${label}${grid[row]!.join('')}`);
  }

  log.plain('');
  log.plain(`  ${chalk.dim(' ')} None  ${chalk.green('░')} Low  ${chalk.green('▒')} Med  ${chalk.greenBright('▓')} High  ${chalk.greenBright('█')} Max`);
  log.plain('');

  log.plain('📊 요약:');
  log.plain(`  총 세션: ${result.total_sessions}`);
  log.plain(`  가장 활발한 날: ${result.most_active_day.date} (${result.most_active_day.count}개 세션)`);
  log.plain(`  현재 연속: ${result.current_streak}일`);
  log.plain(`  최장 연속: ${result.longest_streak}일`);
}

export async function runTimeline(git: GitClient, opts: TimelineOptions): Promise<void> {
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    throw new Error(`Checkpoint branch '${CHECKPOINT_BRANCH}' not found.`);
  }

  const weeks = opts.weeks ?? 12;

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
      printJson(buildTimeline([], weeks));
    } else {
      log.warn('조건에 맞는 checkpoint가 없습니다.');
    }
    return;
  }

  const result = buildTimeline(sessions, weeks);

  if (opts.json) {
    printJson(result);
  } else {
    renderText(result);
  }
}
