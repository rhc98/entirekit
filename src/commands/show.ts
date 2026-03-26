import { GitClient, findMetadataPath, findFilePath } from '../git/client.js';
import { CHECKPOINT_BRANCH, PRICING } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import type { CheckpointMetadata } from '../types.js';

export interface ShowOptions {
  hash: string;
  json?: boolean;
}

export interface ShowResult {
  hash: string;
  session_id: string;
  created_at: string;
  branch: string;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_creation_tokens: number;
    api_call_count: number;
  };
  estimated_cost: number;
  attribution: {
    agent_lines: number;
    agent_percentage: number;
    human_added: number;
    human_modified: number;
    total_committed: number;
  };
  files_touched: string[];
  files_touched_count: number;
  prompt_preview: string;
}

export function buildShowResult(
  metadata: CheckpointMetadata,
  hash: string,
  promptContent: string
): ShowResult {
  const inputCost = ((metadata.token_usage?.input_tokens ?? 0) / 1000) * PRICING.inputPer1k;
  const outputCost = ((metadata.token_usage?.output_tokens ?? 0) / 1000) * PRICING.outputPer1k;
  const cacheReadCost = ((metadata.token_usage?.cache_read_tokens ?? 0) / 1000) * PRICING.cacheReadPer1k;
  const cacheCreationCost = ((metadata.token_usage?.cache_creation_tokens ?? 0) / 1000) * PRICING.cacheCreatePer1k;

  const files = metadata.files_touched ?? [];

  return {
    hash,
    session_id: metadata.session_id ?? metadata.checkpoint_id ?? 'unknown',
    created_at: metadata.created_at ?? 'unknown',
    branch: metadata.branch ?? 'unknown',
    token_usage: {
      input_tokens: metadata.token_usage?.input_tokens ?? 0,
      output_tokens: metadata.token_usage?.output_tokens ?? 0,
      cache_read_tokens: metadata.token_usage?.cache_read_tokens ?? 0,
      cache_creation_tokens: metadata.token_usage?.cache_creation_tokens ?? 0,
      api_call_count: metadata.token_usage?.api_call_count ?? 0,
    },
    estimated_cost: inputCost + outputCost + cacheReadCost + cacheCreationCost,
    attribution: {
      agent_lines: metadata.initial_attribution?.agent_lines ?? 0,
      agent_percentage: metadata.initial_attribution?.agent_percentage ?? 0,
      human_added: metadata.initial_attribution?.human_added ?? 0,
      human_modified: metadata.initial_attribution?.human_modified ?? 0,
      total_committed: metadata.initial_attribution?.total_committed ?? 0,
    },
    files_touched: files,
    files_touched_count: files.length,
    prompt_preview: promptContent
      ? promptContent.split('\n').slice(0, 10).join('\n')
      : '',
  };
}

function renderText(result: ShowResult): void {
  log.plain('📋 Checkpoint 상세 정보');
  log.plain('================================');
  log.plain(`Hash:       ${result.hash}`);
  log.plain(`Session:    ${result.session_id}`);
  log.plain(`Date:       ${result.created_at}`);
  log.plain(`Branch:     ${result.branch}`);
  log.plain(`Est. Cost:  $${result.estimated_cost.toFixed(4)}`);
  log.plain('');

  log.plain('🔢 토큰 사용량:');
  log.plain(`  Input:          ${result.token_usage.input_tokens}`);
  log.plain(`  Output:         ${result.token_usage.output_tokens}`);
  log.plain(`  Cache Read:     ${result.token_usage.cache_read_tokens}`);
  log.plain(`  Cache Creation: ${result.token_usage.cache_creation_tokens}`);
  log.plain(`  API Calls:      ${result.token_usage.api_call_count}`);
  log.plain('');

  log.plain('🤖 AI 기여도:');
  log.plain(`  Agent Lines:    ${result.attribution.agent_lines}`);
  log.plain(`  Agent %:        ${result.attribution.agent_percentage}%`);
  log.plain(`  Human Added:    ${result.attribution.human_added}`);
  log.plain(`  Human Modified: ${result.attribution.human_modified}`);
  log.plain(`  Total Committed:${result.attribution.total_committed}`);
  log.plain('');

  log.plain(`📂 수정된 파일 (${result.files_touched_count}개):`);
  for (const file of result.files_touched.slice(0, 30)) {
    log.plain(`  - ${file}`);
  }
  if (result.files_touched_count > 30) {
    log.plain(`  ... and ${result.files_touched_count - 30} more`);
  }

  if (result.prompt_preview) {
    log.plain('');
    log.plain('📝 프롬프트 미리보기:');
    log.plain('---');
    log.plain(result.prompt_preview);
    log.plain('---');
  }
}

export async function runShow(git: GitClient, opts: ShowOptions): Promise<void> {
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    throw new Error(`Checkpoint branch '${CHECKPOINT_BRANCH}' not found.`);
  }

  const { hash } = opts;
  const metaPath = await findMetadataPath(git, hash);
  if (!metaPath) {
    throw new Error(`metadata.json not found for checkpoint '${hash}'.`);
  }

  const metaJson = await git.showFile(hash, metaPath);
  const metadata: CheckpointMetadata = JSON.parse(metaJson);

  // Try to get prompt preview
  let promptContent = '';
  const promptPath = await findFilePath(git, hash, '/prompt.txt');
  if (promptPath) {
    try {
      promptContent = await git.showFile(hash, promptPath);
    } catch {
      // Ignore
    }
  }

  const result = buildShowResult(metadata, hash, promptContent);

  if (opts.json) {
    printJson(result);
  } else {
    renderText(result);
  }
}
