import { GitClient, findMetadataPath } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import type { CheckpointMetadata } from '../types.js';

export interface DiffOptions {
  hash1: string;
  hash2: string;
  json?: boolean;
}

export function setDifference(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter(item => !bSet.has(item));
}

export interface DiffResult {
  checkpoint1: {
    hash: string;
    created_at: string;
    branch: string;
    token_usage: CheckpointMetadata['token_usage'];
    initial_attribution: CheckpointMetadata['initial_attribution'];
    files_touched_count: number;
    files_touched: string[];
  };
  checkpoint2: {
    hash: string;
    created_at: string;
    branch: string;
    token_usage: CheckpointMetadata['token_usage'];
    initial_attribution: CheckpointMetadata['initial_attribution'];
    files_touched_count: number;
    files_touched: string[];
  };
  delta: {
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    api_call_count: number;
    agent_percentage: number;
    files_added: string[];
    files_removed: string[];
    common_files_count: number;
  };
}

export function buildDiffResult(
  meta1: CheckpointMetadata,
  meta2: CheckpointMetadata,
  hash1: string,
  hash2: string
): DiffResult {
  const files1 = meta1.files_touched ?? [];
  const files2 = meta2.files_touched ?? [];
  const filesAdded = setDifference(files2, files1);
  const filesRemoved = setDifference(files1, files2);
  const commonFilesCount = files1.length - filesRemoved.length;

  return {
    checkpoint1: {
      hash: hash1,
      created_at: meta1.created_at ?? 'unknown',
      branch: meta1.branch ?? 'unknown',
      token_usage: meta1.token_usage ?? {},
      initial_attribution: meta1.initial_attribution ?? {},
      files_touched_count: files1.length,
      files_touched: files1,
    },
    checkpoint2: {
      hash: hash2,
      created_at: meta2.created_at ?? 'unknown',
      branch: meta2.branch ?? 'unknown',
      token_usage: meta2.token_usage ?? {},
      initial_attribution: meta2.initial_attribution ?? {},
      files_touched_count: files2.length,
      files_touched: files2,
    },
    delta: {
      input_tokens: (meta2.token_usage?.input_tokens ?? 0) - (meta1.token_usage?.input_tokens ?? 0),
      output_tokens: (meta2.token_usage?.output_tokens ?? 0) - (meta1.token_usage?.output_tokens ?? 0),
      cache_read_tokens: (meta2.token_usage?.cache_read_tokens ?? 0) - (meta1.token_usage?.cache_read_tokens ?? 0),
      api_call_count: (meta2.token_usage?.api_call_count ?? 0) - (meta1.token_usage?.api_call_count ?? 0),
      agent_percentage: (meta2.initial_attribution?.agent_percentage ?? 0) - (meta1.initial_attribution?.agent_percentage ?? 0),
      files_added: filesAdded,
      files_removed: filesRemoved,
      common_files_count: commonFilesCount,
    },
  };
}

function renderText(diff: DiffResult): void {
  log.plain('📊 Checkpoint 비교');
  log.plain('================================');
  log.plain(`Checkpoint 1: ${diff.checkpoint1.hash.substring(0, 7)} (${diff.checkpoint1.branch}, ${diff.checkpoint1.created_at})`);
  log.plain(`Checkpoint 2: ${diff.checkpoint2.hash.substring(0, 7)} (${diff.checkpoint2.branch}, ${diff.checkpoint2.created_at})`);
  log.plain('');

  log.plain('🔢 토큰 사용량 비교:');
  log.plain(`  Input:  ${diff.checkpoint1.token_usage?.input_tokens ?? 0} -> ${diff.checkpoint2.token_usage?.input_tokens ?? 0} (Δ ${diff.delta.input_tokens})`);
  log.plain(`  Output: ${diff.checkpoint1.token_usage?.output_tokens ?? 0} -> ${diff.checkpoint2.token_usage?.output_tokens ?? 0} (Δ ${diff.delta.output_tokens})`);
  log.plain(`  Cache:  ${diff.checkpoint1.token_usage?.cache_read_tokens ?? 0} -> ${diff.checkpoint2.token_usage?.cache_read_tokens ?? 0} (Δ ${diff.delta.cache_read_tokens})`);
  log.plain(`  Calls:  ${diff.checkpoint1.token_usage?.api_call_count ?? 0} -> ${diff.checkpoint2.token_usage?.api_call_count ?? 0} (Δ ${diff.delta.api_call_count})`);
  log.plain('');

  log.plain('🤖 AI 기여도 비교:');
  log.plain(`  Agent %: ${diff.checkpoint1.initial_attribution?.agent_percentage ?? 0}% -> ${diff.checkpoint2.initial_attribution?.agent_percentage ?? 0}% (Δ ${diff.delta.agent_percentage}%)`);
  log.plain(`  Agent lines: ${diff.checkpoint1.initial_attribution?.agent_lines ?? 0} -> ${diff.checkpoint2.initial_attribution?.agent_lines ?? 0}`);
  log.plain(`  Human modified: ${diff.checkpoint1.initial_attribution?.human_modified ?? 0} -> ${diff.checkpoint2.initial_attribution?.human_modified ?? 0}`);
  log.plain('');

  log.plain('📝 파일 비교:');
  log.plain(`  Checkpoint 1 files: ${diff.checkpoint1.files_touched_count}`);
  log.plain(`  Checkpoint 2 files: ${diff.checkpoint2.files_touched_count}`);
  log.plain(`  Added files: ${diff.delta.files_added.length}`);
  log.plain(`  Removed files: ${diff.delta.files_removed.length}`);
  log.plain(`  Common files: ${diff.delta.common_files_count}`);
  log.plain('');

  log.plain('➕ Added files (up to 20):');
  diff.delta.files_added.slice(0, 20).forEach(file => {
    log.plain(`  + ${file}`);
  });

  log.plain('➖ Removed files (up to 20):');
  diff.delta.files_removed.slice(0, 20).forEach(file => {
    log.plain(`  - ${file}`);
  });
}

export async function runDiff(git: GitClient, opts: DiffOptions): Promise<void> {
  const { hash1, hash2 } = opts;

  // Verify checkpoint branch exists
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    log.error(`Checkpoint branch '${CHECKPOINT_BRANCH}' not found.`);
    process.exit(1);
  }

  // Find metadata paths for both hashes
  const metaPath1 = await findMetadataPath(git, hash1);
  const metaPath2 = await findMetadataPath(git, hash2);

  if (!metaPath1 || !metaPath2) {
    log.error('metadata.json not found for one or both checkpoints.');
    process.exit(1);
  }

  // Read metadata
  let meta1: CheckpointMetadata;
  let meta2: CheckpointMetadata;

  try {
    const metaJson1 = await git.showFile(hash1, metaPath1);
    const metaJson2 = await git.showFile(hash2, metaPath2);
    meta1 = JSON.parse(metaJson1);
    meta2 = JSON.parse(metaJson2);
  } catch (error) {
    log.error('Unable to read checkpoint metadata.');
    throw error;
  }

  // Build diff result
  const diff = buildDiffResult(meta1, meta2, hash1, hash2);

  // Output
  if (opts.json) {
    printJson(diff);
  } else {
    renderText(diff);
  }
}
