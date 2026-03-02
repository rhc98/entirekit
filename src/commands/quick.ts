import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log } from '../utils/output.js';

export async function runRecent(git: GitClient): Promise<void> {
  try {
    const entries = await git.logOneline(CHECKPOINT_BRANCH, { n: 10 });

    if (entries.length === 0) {
      log.warn('No checkpoints found.');
      return;
    }

    for (const entry of entries) {
      log.plain(`${entry.hash} ${entry.subject}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(`Failed to fetch recent checkpoints: ${error.message}`);
    }
    throw error;
  }
}

export async function runToday(git: GitClient): Promise<void> {
  try {
    const entries = await git.logOneline(CHECKPOINT_BRANCH, { since: 'today' });

    if (entries.length === 0) {
      log.warn('No checkpoints found today.');
      return;
    }

    for (const entry of entries) {
      log.plain(`${entry.hash} ${entry.subject}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(`Failed to fetch today's checkpoints: ${error.message}`);
    }
    throw error;
  }
}

export async function runYesterday(git: GitClient): Promise<void> {
  try {
    const entries = await git.logOneline(CHECKPOINT_BRANCH, { since: 'yesterday', until: 'today' });

    if (entries.length === 0) {
      log.warn('No checkpoints found yesterday.');
      return;
    }

    for (const entry of entries) {
      log.plain(`${entry.hash} ${entry.subject}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(`Failed to fetch yesterday's checkpoints: ${error.message}`);
    }
    throw error;
  }
}

export async function runWeek(git: GitClient): Promise<void> {
  try {
    const entries = await git.logOneline(CHECKPOINT_BRANCH, { since: '1 week ago' });

    if (entries.length === 0) {
      log.warn('No checkpoints found in the last week.');
      return;
    }

    for (const entry of entries) {
      log.plain(`${entry.hash} ${entry.subject}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(`Failed to fetch last week's checkpoints: ${error.message}`);
    }
    throw error;
  }
}
