import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import { matchesBranchFilter, matchesDateFilter } from '../utils/filters.js';
import type { CheckpointMetadata, FilterOptions } from '../types.js';

export interface SearchOptions extends FilterOptions {
  keyword: string;
  json?: boolean;
}

interface PromptMatch {
  hash: string;
  date: string;
  branch: string;
  snippet: string;
}

interface FileMatch {
  hash: string;
  date: string;
  branch: string;
  files: string[];
}

interface SearchResult {
  keyword: string;
  filters: {
    limit: number;
    branch: string;
    since: string;
    until: string;
  };
  prompt_match_count: number;
  file_match_count: number;
  prompt_matches: PromptMatch[];
  file_matches: FileMatch[];
}

export async function runSearch(git: GitClient, opts: SearchOptions): Promise<void> {
  const { keyword } = opts;
  const keywordLower = keyword.toLowerCase();

  // Verify checkpoint branch exists
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    throw new Error(`Checkpoint branch '${CHECKPOINT_BRANCH}' not found.`);
  }

  const promptMatches: PromptMatch[] = [];
  const fileMatches: FileMatch[] = [];

  // Optimized: use latest commit's tree to list all session dirs at once
  const allHashes = await git.logHashes(CHECKPOINT_BRANCH);
  if (allHashes.length === 0) {
    if (opts.json) {
      printJson({
        keyword,
        filters: { limit: opts.limit ?? 20, branch: opts.branch ?? '', since: opts.since ?? '', until: opts.until ?? '' },
        prompt_match_count: 0,
        file_match_count: 0,
        prompt_matches: [],
        file_matches: [],
      });
    } else {
      log.warn('No checkpoints found.');
    }
    return;
  }

  const latestHash = allHashes[0]!;
  const allFiles = await git.listTree(latestHash);

  // Group files by session directory
  const sessionDirs = new Map<string, string[]>();
  for (const filePath of allFiles) {
    const parts = filePath.split('/');
    if (parts.length >= 2) {
      const sessionDir = parts.slice(0, -1).join('/');
      if (!sessionDirs.has(sessionDir)) {
        sessionDirs.set(sessionDir, []);
      }
      sessionDirs.get(sessionDir)!.push(filePath);
    }
  }

  let selected = 0;

  for (const [sessionDir, files] of sessionDirs) {
    // Find metadata.json
    const metadataPath = files.find(f => /\/metadata\.json$/.test(f));
    if (!metadataPath) continue;

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

    // Check prompt and context
    const promptPath = files.find(f => f.endsWith('/prompt.txt'));
    const contextPath = files.find(f => f.endsWith('/context.md'));

    let promptContent = '';
    let contextContent = '';

    if (promptPath) {
      try {
        promptContent = await git.showFile(latestHash, promptPath);
      } catch {
        // Ignore
      }
    }

    if (contextPath) {
      try {
        contextContent = await git.showFile(latestHash, contextPath);
      } catch {
        // Ignore
      }
    }

    const combinedContent = `${promptContent} ${contextContent}`.toLowerCase();
    if (combinedContent.includes(keywordLower)) {
      let snippet = '';
      if (promptContent) {
        snippet = promptContent.split('\n').slice(0, 5).join('\n');
      } else if (contextContent) {
        const lines = contextContent.split('\n');
        const matchingLineIndex = lines.findIndex(line =>
          line.toLowerCase().includes(keywordLower)
        );
        if (matchingLineIndex !== -1) {
          const start = Math.max(0, matchingLineIndex - 2);
          const end = Math.min(lines.length, matchingLineIndex + 3);
          snippet = lines.slice(start, end).join('\n');
        } else {
          snippet = lines.slice(0, 5).join('\n');
        }
      }

      // Use session directory name as a short hash identifier
      const hashId = sessionDir.split('/').pop() ?? sessionDir;
      promptMatches.push({
        hash: hashId,
        date: createdAt,
        branch,
        snippet,
      });
    }

    // Check files touched
    const filesTouched = metadata.files_touched ?? [];
    const matchingFiles = filesTouched.filter(file =>
      file.toLowerCase().includes(keywordLower)
    );

    if (matchingFiles.length > 0) {
      const hashId = sessionDir.split('/').pop() ?? sessionDir;
      fileMatches.push({
        hash: hashId,
        date: createdAt,
        branch,
        files: matchingFiles,
      });
    }

    selected++;
    if (opts.limit && opts.limit > 0 && selected >= opts.limit) {
      break;
    }
  }

  // Build result
  const result: SearchResult = {
    keyword,
    filters: {
      limit: opts.limit ?? 20,
      branch: opts.branch ?? '',
      since: opts.since ?? '',
      until: opts.until ?? '',
    },
    prompt_match_count: promptMatches.length,
    file_match_count: fileMatches.length,
    prompt_matches: promptMatches,
    file_matches: fileMatches,
  };

  // Output
  if (opts.json) {
    printJson(result);
    return;
  }

  // Text output
  log.plain(`🔍 '${keyword}' 검색 중...`);
  log.plain('================================');
  log.plain(
    `Filters: limit=${result.filters.limit} branch='${result.filters.branch || '*'}' since='${result.filters.since || '*'}' until='${result.filters.until || '*'}'`
  );
  log.plain('');

  log.plain('📝 관련 프롬프트:');
  if (promptMatches.length === 0) {
    log.plain('  (검색 결과 없음)');
  } else {
    for (const match of promptMatches) {
      log.plain('');
      log.plain(`[${match.date}] Checkpoint: ${match.hash.substring(0, 7)}`);
      log.plain('---');
      log.plain(match.snippet);
    }
  }

  log.plain('');
  log.plain('📂 관련 파일 수정 이력:');
  if (fileMatches.length === 0) {
    log.plain('  (검색 결과 없음)');
  } else {
    for (const match of fileMatches) {
      log.plain('');
      log.plain(`[${match.date}] Checkpoint: ${match.hash.substring(0, 7)}`);
      log.plain('Files touched:');
      for (const file of match.files) {
        log.plain(`  - ${file}`);
      }
    }
  }
}
