import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log } from '../utils/output.js';

async function runQuickCommand(
  git: GitClient,
  opts: { n?: number; since?: string; until?: string },
  emptyMessage: string
): Promise<void> {
  const entries = await git.logOneline(CHECKPOINT_BRANCH, opts);

  if (entries.length === 0) {
    log.warn(emptyMessage);
    return;
  }

  for (const entry of entries) {
    log.plain(`${entry.hash} ${entry.subject}`);
  }
}

export async function runRecent(git: GitClient): Promise<void> {
  await runQuickCommand(git, { n: 10 }, 'No checkpoints found.');
}

export async function runToday(git: GitClient): Promise<void> {
  await runQuickCommand(git, { since: 'today' }, 'No checkpoints found today.');
}

export async function runYesterday(git: GitClient): Promise<void> {
  await runQuickCommand(git, { since: 'yesterday', until: 'today' }, 'No checkpoints found yesterday.');
}

export async function runWeek(git: GitClient): Promise<void> {
  await runQuickCommand(git, { since: '1 week ago' }, 'No checkpoints found in the last week.');
}
