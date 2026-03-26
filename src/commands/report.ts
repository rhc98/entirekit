import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH, PRICING } from '../constants.js';
import { log } from '../utils/output.js';
import { matchesBranchFilter, matchesDateFilter } from '../utils/filters.js';
import { buildReportJson } from '../report/aggregators.js';
import { generateHtml } from '../report/html-template.js';
import { buildCsvContent } from '../report/csv.js';
import type { CheckpointMetadata, FilterOptions } from '../types.js';
import ora from 'ora';
import openBrowser from 'open';

export interface ReportOptions extends FilterOptions {
  output?: string;
  exportJson?: string;
  exportCsv?: string;
  noOpen?: boolean;
}

export function sortSessionsMostRecent(sessions: CheckpointMetadata[]): CheckpointMetadata[] {
  return [...sessions].sort((a, b) => {
    const createdAtA = a.created_at ?? '';
    const createdAtB = b.created_at ?? '';
    return createdAtB.localeCompare(createdAtA);
  });
}

export function applySessionLimit(
  sessions: CheckpointMetadata[],
  limit: number | undefined
): CheckpointMetadata[] {
  if (!limit || limit <= 0) {
    return sessions;
  }
  return sessions.slice(0, limit);
}

export async function runReport(git: GitClient, opts: ReportOptions): Promise<void> {
  // Check if checkpoint branch exists
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    throw new Error(`Checkpoint branch '${CHECKPOINT_BRANCH}' not found. Run 'entire' to create some checkpoints first.`);
  }

  // Count revisions
  const revisionCount = await git.countRevisions(CHECKPOINT_BRANCH);
  log.info(`Found ${revisionCount} commits on ${CHECKPOINT_BRANCH}`);

  if (revisionCount === 0) {
    log.warn('No checkpoints found. Run \'entire\' to create some first.');
    return;
  }

  // Step 1: Collect metadata using the optimized approach (git ls-tree on latest commit)
  const spinner1 = ora('Collecting checkpoint metadata...').start();

  // Get the latest commit hash
  const allHashes = await git.logHashes(CHECKPOINT_BRANCH);
  if (allHashes.length === 0) {
    spinner1.fail('No commits found');
    return;
  }

  const latestHash = allHashes[0]!; // Safe: we checked length above

  // List all metadata.json files in the latest commit
  const allFiles = await git.listTree(latestHash);
  const metadataPaths = allFiles.filter(filePath => /\/\d+\/metadata\.json$/.test(filePath));

  // Collect all sessions
  const sessions: CheckpointMetadata[] = [];
  for (const metadataPath of metadataPaths) {
    try {
      const content = await git.showFile(latestHash, metadataPath);
      if (!content) continue;

      const metadata: CheckpointMetadata = JSON.parse(content);

      // Apply filters
      if (!matchesBranchFilter(metadata.branch, opts.branch)) {
        continue;
      }

      if (!matchesDateFilter(metadata.created_at, opts.since, opts.until)) {
        continue;
      }

      sessions.push(metadata);
    } catch (error) {
      // Skip invalid JSON
      continue;
    }
  }

  const sortedSessions = sortSessionsMostRecent(sessions);
  const selectedSessions = applySessionLimit(sortedSessions, opts.limit);

  spinner1.succeed(`Collected ${selectedSessions.length} session(s)`);

  if (selectedSessions.length === 0) {
    log.warn('No sessions matched the given filters.');
    return;
  }

  // Step 2: Aggregate statistics
  const spinner2 = ora('Aggregating statistics...').start();
  const reportData = buildReportJson(selectedSessions, PRICING);
  spinner2.succeed('Statistics aggregated');

  // Step 3: Optional JSON export
  if (opts.exportJson) {
    try {
      fs.writeFileSync(opts.exportJson, JSON.stringify(reportData, null, 2), 'utf-8');
      log.ok(`JSON export saved to: ${opts.exportJson}`);
    } catch (error) {
      log.error(`Failed to write JSON export to '${opts.exportJson}': ${error instanceof Error ? error.message : error}`);
    }
  }

  // Step 4: Optional CSV export
  if (opts.exportCsv) {
    try {
      const csvContent = buildCsvContent(reportData);
      fs.writeFileSync(opts.exportCsv, csvContent, 'utf-8');
      log.ok(`CSV export saved to: ${opts.exportCsv}`);
    } catch (error) {
      log.error(`Failed to write CSV export to '${opts.exportCsv}': ${error instanceof Error ? error.message : error}`);
    }
  }

  // Step 5: Generate HTML report
  const spinner3 = ora('Generating HTML report...').start();

  // Default output path
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = opts.output ?? path.join(os.tmpdir(), `entire-report-${timestamp}.html`);

  try {
    const htmlContent = generateHtml(reportData);
    fs.writeFileSync(outputPath, htmlContent, 'utf-8');
    spinner3.succeed(`Report saved to: ${outputPath}`);
  } catch (error) {
    spinner3.fail(`Failed to write report to '${outputPath}'`);
    throw error;
  }

  // Print file size
  const fileStats = fs.statSync(outputPath);
  const fileSizeKB = Math.floor(fileStats.size / 1024);
  log.info(`File size: ${fileSizeKB}KB`);

  // Step 6: Open in browser
  if (!opts.noOpen) {
    try {
      await openBrowser(outputPath);
      log.ok('Opened in browser');
    } catch {
      log.warn(`Could not open browser automatically. Open manually: ${outputPath}`);
    }
  }
}
