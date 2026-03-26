import fs from 'node:fs';
import path from 'node:path';
import { GitClient, findMetadataPath } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log } from '../utils/output.js';
import type { CheckpointMetadata } from '../types.js';

export interface ExportOptions {
  hash: string;
  output?: string;
  format?: 'files' | 'md';
}

export function buildMarkdownSummary(
  metadata: CheckpointMetadata,
  hash: string,
  promptContent: string,
  contextContent: string
): string {
  const lines: string[] = [];

  lines.push(`# Checkpoint: ${hash.substring(0, 7)}`);
  lines.push('');
  lines.push(`- **Session ID:** ${metadata.session_id ?? metadata.checkpoint_id ?? 'unknown'}`);
  lines.push(`- **Date:** ${metadata.created_at ?? 'unknown'}`);
  lines.push(`- **Branch:** ${metadata.branch ?? 'unknown'}`);
  lines.push('');

  // Token usage
  if (metadata.token_usage) {
    lines.push('## Token Usage');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Input Tokens | ${metadata.token_usage.input_tokens ?? 0} |`);
    lines.push(`| Output Tokens | ${metadata.token_usage.output_tokens ?? 0} |`);
    lines.push(`| Cache Read | ${metadata.token_usage.cache_read_tokens ?? 0} |`);
    lines.push(`| Cache Creation | ${metadata.token_usage.cache_creation_tokens ?? 0} |`);
    lines.push(`| API Calls | ${metadata.token_usage.api_call_count ?? 0} |`);
    lines.push('');
  }

  // Attribution
  if (metadata.initial_attribution) {
    lines.push('## AI Contribution');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Agent Lines | ${metadata.initial_attribution.agent_lines ?? 0} |`);
    lines.push(`| Agent % | ${metadata.initial_attribution.agent_percentage ?? 0}% |`);
    lines.push(`| Human Added | ${metadata.initial_attribution.human_added ?? 0} |`);
    lines.push(`| Human Modified | ${metadata.initial_attribution.human_modified ?? 0} |`);
    lines.push(`| Total Committed | ${metadata.initial_attribution.total_committed ?? 0} |`);
    lines.push('');
  }

  // Files touched
  const files = metadata.files_touched ?? [];
  if (files.length > 0) {
    lines.push('## Files Touched');
    lines.push('');
    for (const file of files) {
      lines.push(`- ${file}`);
    }
    lines.push('');
  }

  // Prompt
  if (promptContent) {
    lines.push('## Prompt');
    lines.push('');
    lines.push('```');
    lines.push(promptContent);
    lines.push('```');
    lines.push('');
  }

  // Context
  if (contextContent) {
    lines.push('## Context');
    lines.push('');
    lines.push(contextContent);
    lines.push('');
  }

  return lines.join('\n');
}

export async function runExport(git: GitClient, opts: ExportOptions): Promise<void> {
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    throw new Error(`Checkpoint branch '${CHECKPOINT_BRANCH}' not found.`);
  }

  const { hash } = opts;
  const format = opts.format ?? 'files';

  // List all files in this checkpoint
  const allFiles = await git.listTree(hash);
  if (allFiles.length === 0) {
    throw new Error(`No files found in checkpoint '${hash}'.`);
  }

  // Read metadata
  const metaPath = await findMetadataPath(git, hash);
  let metadata: CheckpointMetadata = {};
  if (metaPath) {
    try {
      const metaJson = await git.showFile(hash, metaPath);
      metadata = JSON.parse(metaJson);
    } catch {
      // Continue without metadata
    }
  }

  if (format === 'md') {
    // Export as single markdown file
    let promptContent = '';
    let contextContent = '';

    const promptPath = allFiles.find(f => f.endsWith('/prompt.txt'));
    if (promptPath) {
      try {
        promptContent = await git.showFile(hash, promptPath);
      } catch { /* ignore */ }
    }

    const contextPath = allFiles.find(f => f.endsWith('/context.md'));
    if (contextPath) {
      try {
        contextContent = await git.showFile(hash, contextPath);
      } catch { /* ignore */ }
    }

    const md = buildMarkdownSummary(metadata, hash, promptContent, contextContent);
    const shortHash = hash.substring(0, 7);
    const outputPath = opts.output ?? `checkpoint-${shortHash}.md`;

    fs.writeFileSync(outputPath, md, 'utf-8');
    log.ok(`Markdown export saved to: ${outputPath}`);
    return;
  }

  // Export as files
  const shortHash = hash.substring(0, 7);
  const outputDir = opts.output ?? path.join('.entirekit-export', shortHash);

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  let exportedCount = 0;
  for (const filePath of allFiles) {
    try {
      const content = await git.showFile(hash, filePath);
      const targetPath = path.join(outputDir, filePath);
      const targetDir = path.dirname(targetPath);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetPath, content, 'utf-8');
      exportedCount++;
    } catch {
      log.warn(`Failed to export: ${filePath}`);
    }
  }

  log.ok(`Exported ${exportedCount} file(s) to: ${outputDir}`);
}
